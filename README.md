# Retention Room

**Which scene lost them?** Retention Room puts a streaming series' playback telemetry and its scripts in the same room. An editor asks *"why does episode 4 lose people?"* and a Gemini agent queries ClickHouse — through the official ClickHouse MCP server — finds the steepest drop, rules out a delivery problem, maps the second to the scene, reads the scene, and writes an editorial note: what to trim, what to move, what the audience rewatches and wants more of.

Built for the **Agentic Cinema hackathon — ClickHouse track**, on Google Cloud Agent Builder (ADK) + Gemini, with ClickHouse Cloud via `mcp-clickhouse`.

## Why this exists

Post-production and streaming analytics live in different buildings. Editors get retention as a dashboard number; data teams don't read scripts. When an episode bleeds audience at minute 34, nobody in the edit knows whether it's the nine-minute exposition scene, a mid-roll ad, or a CDN edge rebuffering in one region. Retention Room answers that in one question, with the SQL shown.

## How it works

```
question ─▶ RetentionRoom (ADK SequentialAgent)
             ├─ analyst  LlmAgent (Gemini 2.5 Pro) + MCPToolset ──stdio──▶ mcp-clickhouse ──▶ ClickHouse Cloud
             │           scene_completion → steepest 60s window → exits by device/region/cdn + rebuffers
             │           → scene text + the scene before it → rewind hotspots
             └─ editor   LlmAgent (Gemini 2.5 Pro) turns the findings into a recut / reorder / trailer note
```

- **All agent database access goes through the official `mcp-clickhouse` server** (`agent/pipeline.py`, `MCPToolset` + `StdioConnectionParams`), read-only, tool `run_query`. The server runs as its own process from its own venv because it needs `mcp>=2` while ADK's client pins `mcp<2` (see `Dockerfile`).
- **The analyst follows a fixed procedure** (in its instruction) so answers are auditable: rank scenes by loss per minute → find the steepest minute → break exits down by device/region/CDN and check rebuffers → read the scene → check rewinds. Every SQL statement it ran is returned in a `Data` block and shown in the UI.
- **The schema does the heavy lifting** (`sql/schema.sql`): `sessions` and `playback_events` feed three materialized views into `SummingMergeTree` tables — exits and starts per second, rewind targets in 10-second buckets, rebuffers per minute by CDN — plus two views, `retention_curve` (one row per second of runtime, via a `range()` array join) and `scene_completion` (scene bands joined to the curve, with completion and loss-per-minute). Per-second retention over millions of sessions is a millisecond query.
- **The UI** (`web/index.html`) draws the retention curve with scene bands over it and rewinds underneath, and the chat shows each `run_query` call as it happens. Scenes the analyst names get flagged on the chart.

Runtime integrations, in code:

| Requirement | Where |
|---|---|
| Google ADK | `agent/pipeline.py` (`SequentialAgent`, `LlmAgent`, `MCPToolset`), `app/main.py` (`InMemoryRunner`) |
| Gemini via `google-genai` (through ADK) | `agent/pipeline.py`, models `gemini-2.5-pro` |
| ClickHouse via official MCP server | `agent/pipeline.py` → `mcp-clickhouse` (`run_query`, `list_tables`) |
| ClickHouse SDK (UI chart data + loader) | `app/main.py`, `scripts/seed.py` (`clickhouse-connect`) |
| Google Cloud runtime | Cloud Run (`Dockerfile`, `scripts/deploy.sh`), Vertex AI, Secret Manager |

## The catalogue: *Cold Harbor*

An original eight-episode coastal mystery (`data/show.py`): 107 scenes with sluglines, summaries and script excerpts. The audience is simulated (`scripts/seed.py`) from a per-second quit hazard shaped by scene kind and a handful of story-driven seeds, so the data tells a story an editor can act on:

- **Ep 4, scene 13** — nine minutes of dredging-permit history right after June's confession. Retention falls from 77% to 59% inside the scene; the confession before it is the episode's top rewind.
- **Ep 1, scene 9** — the council meeting; the pilot's mid-episode bleed.
- **Ep 5, 11:30–13:00** — looks like a story drop; is actually `smart_tv` / `LATAM` / `edge-c` rebuffering. The analyst is instructed to check this before blaming the scene.
- **Ep 8** — 62% of finishers stop at the end credits and miss the post-credits tag.
- Rewind hotspots on every reveal: the ledger, the transponder confession, Danny's phone video.

Default load is 60k sessions in the pilot decaying to ~36k by mid-season (about 30M playback events); set `SESSIONS_PER_EPISODE` to scale.

## Run it

```bash
# 1. ClickHouse: a Cloud service (free trial) or a local `clickhouse server`
# 2. The MCP server in its own venv
python3 -m venv /opt/mcp-clickhouse && /opt/mcp-clickhouse/bin/pip install "mcp-clickhouse>=0.6"
# 3. Schema + data
cp .env.example .env   # CLICKHOUSE_*, GOOGLE_API_KEY (or Vertex settings)
set -a; . ./.env; set +a
python scripts/seed.py --drop            # add --sessions 10000 for a quick load
# 4. App
./scripts/run_local.sh                   # http://localhost:8080
```

## Deploy to Cloud Run

```bash
PROJECT=your-project REGION=us-central1 CLICKHOUSE_HOST=abc.us-east-1.aws.clickhouse.cloud ./scripts/deploy.sh
```

Runs the loader from your machine first (`scripts/seed.py` against the Cloud service), then deploys. `--min-instances 1` keeps the MCP server process warm.

## Ask it

- Why does this episode lose people?
- Is the drop at the top of episode 5 the story or the stream?
- What do viewers rewatch most in episode 6?
- Which episode has the worst mid-episode drop this season?
- How many finishers missed the post-credits scene in episode 8?

## What we learned

- Timeline-aligned joins are the whole trick. Once scenes are rows with `start_sec`/`end_sec`, "which scene" is a range join against a per-second curve, and ClickHouse makes that trivially cheap.
- Pre-aggregate exits, not viewers. Storing `exits` and `starts` per second and taking a running sum at query time keeps the materialized view tiny and the curve exact.
- The agent needs an explicit procedure. A free-form "look at the data" prompt produced plausible stories; the ordered procedure — including the delivery-vs-story check — produced ones the data actually supports.

## License

MIT — see `LICENSE`.
