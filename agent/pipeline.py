"""Retention Room agent network (Google ADK + Gemini + the official ClickHouse MCP server).

    RetentionRoom (SequentialAgent)
      ├── analyst   LlmAgent + MCPToolset(mcp-clickhouse)   runs SQL, finds the drop, rules out delivery causes
      └── editor    LlmAgent                                turns the finding into editorial recommendations

All database access by the agent goes through the official `mcp-clickhouse` server over stdio
(`run_query`, `list_tables`). The server runs as its own process because it needs
`mcp>=2` while ADK's client side pins `mcp<2`.
"""
from __future__ import annotations

import os

from google.adk.agents import LlmAgent, SequentialAgent
from google.adk.tools.mcp_tool import MCPToolset, StdioConnectionParams
from google.genai import types
from mcp import StdioServerParameters

ANALYST_MODEL = os.environ.get("ANALYST_MODEL", "gemini-2.5-pro")
EDITOR_MODEL = os.environ.get("EDITOR_MODEL", "gemini-2.5-pro")
DB = os.environ.get("CLICKHOUSE_DATABASE", "retention")


def clickhouse_toolset() -> MCPToolset:
    env = {
        "CLICKHOUSE_HOST": os.environ.get("CLICKHOUSE_HOST", "localhost"),
        "CLICKHOUSE_PORT": os.environ.get("CLICKHOUSE_PORT", "8443"),
        "CLICKHOUSE_USER": os.environ.get("CLICKHOUSE_USER", "default"),
        "CLICKHOUSE_PASSWORD": os.environ.get("CLICKHOUSE_PASSWORD", ""),
        "CLICKHOUSE_SECURE": os.environ.get("CLICKHOUSE_SECURE", "true"),
        "CLICKHOUSE_VERIFY": os.environ.get("CLICKHOUSE_VERIFY", "true"),
        "CLICKHOUSE_CONNECT_TIMEOUT": "30",
        "CLICKHOUSE_SEND_RECEIVE_TIMEOUT": "120",
        "CLICKHOUSE_ENABLED": "true",
        "PATH": os.environ.get("PATH", ""),
    }
    return MCPToolset(
        connection_params=StdioConnectionParams(
            server_params=StdioServerParameters(
                command=os.environ.get("MCP_CLICKHOUSE_BIN", "mcp-clickhouse"),
                args=[],
                env=env,
            ),
            timeout=60,
        ),
        tool_filter=["run_query", "list_tables"],
    )


ANALYST_INSTRUCTION = f"""You are the retention analyst in a streaming series' editing room.
You answer editors' questions about *where and why* audiences leave or rewatch, using ClickHouse
through the `run_query` tool. Every claim must come from a query you actually ran.

Database `{DB}`:
- scenes(episode, scene_number, start_sec, end_sec, slugline, characters, summary, script_excerpt, act, kind)
- sessions(session_id, user_id, episode, started_at, start_sec, end_sec, completed, device, region, cdn, autoplay)
- playback_events(session_id, episode, ts, position_sec, event, seek_to_sec, device, region, cdn)
- exits_by_second(episode, second, device, region, cdn, exits, starts)   -- SummingMergeTree, use sum()
- seek_heatmap(episode, to_bucket, backward, seeks)                        -- 10s buckets, use sum()
- rebuffers_by_minute(episode, minute, device, region, cdn, rebuffers)    -- use sum()
- retention_curve VIEW (episode, second, viewers, starters, retention)
- scene_completion VIEW (episode, scene_number, slugline, kind, start_sec, end_sec,
                         viewers_at_start, viewers_at_end, completion, loss_per_minute)

Procedure for "why does episode N lose people" style questions — follow it in order:
1. `SELECT * FROM {DB}.scene_completion WHERE episode = N ORDER BY loss_per_minute DESC LIMIT 5`
   to find the scenes bleeding fastest (ignore kind = 'credits' unless asked).
2. Locate the steepest 60-second window inside the top scene from `{DB}.retention_curve`
   (compare retention at second t and t+60 with a self-join or window function).
3. Rule out a delivery problem: break exits in that window down by device, region and cdn from
   `{DB}.exits_by_second`, and check `{DB}.rebuffers_by_minute` for the same minutes. If one
   segment carries the exits and rebuffers spike there, say it is a QoE incident, not a story problem.
4. Read the scene: `SELECT slugline, kind, summary, script_excerpt FROM {DB}.scenes WHERE ...`
   including the scene before it (what the audience just came from).
5. Check what the audience rewatches in that episode from `{DB}.seek_heatmap WHERE backward = 1`
   joined to scenes — these are the beats that work. Ignore to_bucket = 0 (that is people restarting).

For other questions (rewatches, finale tag, device comparisons, episode-to-episode) adapt, but
always query before answering and prefer the pre-aggregated tables/views over raw playback_events.
Use LIMIT on every query. Keep to at most 8 queries per question.

Write your findings as compact markdown for the editor agent:
- The answer in one sentence with the numbers (percent retained before/after, seconds, scene).
- Whether it is a story problem or a delivery problem, and the evidence for that.
- The scene(s) involved: slugline, kind, summary, and the excerpt if any.
- The rewatch hotspots you found.
- A `Data` section listing each SQL query you ran, verbatim, in a fenced sql block.
"""

EDITOR_INSTRUCTION = """You are a senior series editor. Below are the analyst's findings for the
question the showrunner asked. Turn them into a short editorial note (150-220 words):

- Open with the finding in plain language: which scene, what the audience did, how much.
- If it's a delivery incident, say so and hand it to the streaming ops team — don't recut a scene
  for a CDN problem.
- If it's a story problem, give two or three concrete options: a recut (what to trim or move
  and by how much), a reorder (which beat to bring forward), or a structural fix for next season.
  Reference the scene before it — a drop after a strong reveal usually means the follow-up scene
  broke the momentum.
- Use the rewatch hotspots as evidence of what the audience wants more of, and suggest one for
  the trailer or the "previously on".
- End with the single change you'd make first.

Plain prose with short paragraphs. No headings. Do not repeat the SQL.

Analyst findings:
{findings}
"""


def build_pipeline() -> SequentialAgent:
    analyst = LlmAgent(
        name="analyst",
        model=ANALYST_MODEL,
        description="Queries ClickHouse through the MCP server to locate and explain audience drop-off.",
        instruction=ANALYST_INSTRUCTION,
        tools=[clickhouse_toolset()],
        output_key="findings",
        generate_content_config=types.GenerateContentConfig(temperature=0.1),
    )
    editor = LlmAgent(
        name="editor",
        model=EDITOR_MODEL,
        description="Writes the editorial recommendation from the analyst's findings.",
        instruction=EDITOR_INSTRUCTION,
        include_contents="none",
        output_key="recommendation",
        generate_content_config=types.GenerateContentConfig(temperature=0.4),
    )
    return SequentialAgent(name="RetentionRoom", sub_agents=[analyst, editor])
