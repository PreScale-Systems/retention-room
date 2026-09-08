"""Retention Room API + UI.

GET  /api/episodes                 episode list with starters / completion
GET  /api/episodes/{ep}/curve      per-second retention (downsampled to 5s) + scene bands
GET  /api/episodes/{ep}/seeks      backward-seek heatmap
GET  /api/episodes/{ep}/rebuffers  rebuffers per minute by cdn
POST /api/chat                     {conversation_id?, question, episode?} → SSE stream of
                                   tool calls (SQL), analyst findings, editor recommendation

The UI data endpoints use clickhouse-connect directly (they are plumbing for the chart).
The *agent* only talks to ClickHouse through the official mcp-clickhouse server.
"""
from __future__ import annotations

import asyncio
import json
import os
import uuid
from pathlib import Path
from typing import Optional

import clickhouse_connect
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from google.adk.runners import InMemoryRunner
from google.genai import types
from pydantic import BaseModel

from agent.pipeline import build_pipeline

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web"
DB = os.environ.get("CLICKHOUSE_DATABASE", "retention")
APP_NAME = "retention-room"

app = FastAPI(title="Retention Room", version="1.0")

_ch = None


def ch():
    global _ch
    if _ch is None:
        _ch = clickhouse_connect.get_client(
            host=os.environ.get("CLICKHOUSE_HOST", "localhost"),
            port=int(os.environ.get("CLICKHOUSE_PORT", "8123")),
            username=os.environ.get("CLICKHOUSE_USER", "default"),
            password=os.environ.get("CLICKHOUSE_PASSWORD", ""),
            secure=os.environ.get("CLICKHOUSE_SECURE", "false").lower() == "true",
        )
    return _ch


def q(sql: str, params: dict | None = None):
    res = ch().query(sql, parameters=params or {})
    return [dict(zip(res.column_names, row)) for row in res.result_rows]


# ----------------------------------------------------------------------------- chart data


@app.get("/api/episodes")
async def episodes():
    rows = await asyncio.to_thread(
        q,
        f"""
        SELECT s.episode AS episode,
               count() AS sessions,
               avg(s.completed) AS completion,
               any(r.runtime) AS runtime
        FROM {DB}.sessions AS s
        LEFT JOIN (SELECT episode, max(end_sec) AS runtime FROM {DB}.scenes GROUP BY episode) AS r ON r.episode = s.episode
        GROUP BY episode ORDER BY episode
        """,
    )
    titles = {1: "Slack Tide", 2: "The Ledger", 3: "Dead Reckoning", 4: "Harbor Deepening",
              5: "Edge of the Chart", 6: "The Other Boat", 7: "Fourteen Feet", 8: "High Water"}
    for r in rows:
        r["title"] = titles.get(r["episode"], f"Episode {r['episode']}")
    return rows


@app.get("/api/episodes/{ep}/curve")
async def curve(ep: int):
    pts = await asyncio.to_thread(
        q,
        f"""
        SELECT second, retention FROM {DB}.retention_curve
        WHERE episode = {{ep:UInt8}} AND second % 5 = 0 ORDER BY second
        """,
        {"ep": ep},
    )
    scenes = await asyncio.to_thread(
        q,
        f"""
        SELECT scene_number, slugline, kind, start_sec, end_sec, completion, loss_per_minute
        FROM {DB}.scene_completion WHERE episode = {{ep:UInt8}} ORDER BY scene_number
        """,
        {"ep": ep},
    )
    detail = await asyncio.to_thread(
        q, f"SELECT scene_number, summary, script_excerpt, characters FROM {DB}.scenes WHERE episode = {{ep:UInt8}}", {"ep": ep}
    )
    d = {r["scene_number"]: r for r in detail}
    for s in scenes:
        s.update(d.get(s["scene_number"], {}))
    if not pts:
        raise HTTPException(404, "no data for that episode — run scripts/seed.py")
    return {"episode": ep, "points": [[p["second"], round(float(p["retention"]), 4)] for p in pts], "scenes": scenes}


@app.get("/api/episodes/{ep}/seeks")
async def seeks(ep: int):
    return await asyncio.to_thread(
        q,
        f"SELECT to_bucket AS second, sum(seeks) AS seeks FROM {DB}.seek_heatmap WHERE episode = {{ep:UInt8}} AND backward = 1 GROUP BY second ORDER BY second",
        {"ep": ep},
    )


@app.get("/api/episodes/{ep}/rebuffers")
async def rebuffers(ep: int):
    return await asyncio.to_thread(
        q,
        f"SELECT minute, cdn, sum(rebuffers) AS rebuffers FROM {DB}.rebuffers_by_minute WHERE episode = {{ep:UInt8}} GROUP BY minute, cdn ORDER BY minute, cdn",
        {"ep": ep},
    )


# ----------------------------------------------------------------------------- agent chat

_runner: Optional[InMemoryRunner] = None
_sessions: dict[str, str] = {}  # conversation_id → adk session id
_lock = asyncio.Lock()


async def runner() -> InMemoryRunner:
    global _runner
    if _runner is None:
        _runner = InMemoryRunner(agent=build_pipeline(), app_name=APP_NAME)
    return _runner


class ChatIn(BaseModel):
    question: str
    conversation_id: Optional[str] = None
    episode: Optional[int] = None


def _sse(obj: dict) -> str:
    return f"data: {json.dumps(obj)}\n\n"


@app.post("/api/chat")
async def chat(body: ChatIn):
    r = await runner()
    cid = body.conversation_id or uuid.uuid4().hex[:10]
    async with _lock:
        if cid not in _sessions:
            s = await r.session_service.create_session(app_name=APP_NAME, user_id="editor")
            _sessions[cid] = s.id
    sid = _sessions[cid]
    text = body.question if body.episode is None else f"(Episode {body.episode} is open in the room.) {body.question}"
    msg = types.Content(role="user", parts=[types.Part(text=text)])

    async def gen():
        yield _sse({"kind": "start", "conversation_id": cid})
        try:
            async for ev in r.run_async(user_id="editor", session_id=sid, new_message=msg):
                if ev.content and ev.content.parts:
                    for p in ev.content.parts:
                        if p.function_call:
                            args = dict(p.function_call.args or {})
                            yield _sse({"kind": "tool_call", "agent": ev.author, "name": p.function_call.name, "args": args})
                        elif p.function_response:
                            resp = p.function_response.response
                            try:  # unwrap mcp-clickhouse's {columns, rows} payload for the UI
                                inner = resp["content"][0]["text"]
                                preview = inner[:1500]
                            except Exception:
                                preview = json.dumps(resp, default=str)[:1200]
                            yield _sse({"kind": "tool_result", "agent": ev.author, "name": p.function_response.name, "preview": preview})
                        elif p.text and not ev.partial:
                            yield _sse({"kind": "text", "agent": ev.author, "text": p.text})
            yield _sse({"kind": "done"})
        except Exception as e:
            yield _sse({"kind": "error", "error": f"{type(e).__name__}: {e}"})

    return StreamingResponse(gen(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})


@app.get("/healthz")
async def healthz():
    try:
        await asyncio.to_thread(q, "SELECT 1")
        db = True
    except Exception:
        db = False
    return {"ok": True, "clickhouse": db}


@app.get("/")
async def index():
    return FileResponse(WEB / "index.html")


app.mount("/static", StaticFiles(directory=WEB), name="static")
