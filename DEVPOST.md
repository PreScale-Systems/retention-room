# Devpost submission — Retention Room (ClickHouse track)

## Inspiration
Editors get audience retention as a number on a dashboard. Data teams don't read scripts. So when episode four bleeds viewers at minute 34, nobody in the edit knows whether it's the nine-minute exposition scene, an ad slot, or a CDN edge rebuffering in one region. We wanted an agent that sits in the editing room and answers "which scene lost them, and what do we do about it" — with the SQL on the table.

## What it does
Retention Room joins a series' playback telemetry (sessions, heartbeats, seeks, rebuffers, exits) with its scripts (scene boundaries, sluglines, summaries, excerpts) in ClickHouse. An editor asks a question; a Gemini analyst agent queries ClickHouse through the official ClickHouse MCP server following a fixed procedure — rank scenes by loss per minute, find the steepest minute, break exits down by device/region/CDN and check rebuffers so a delivery incident isn't blamed on the writing, read the scene and the scene before it, check what the audience rewinds to — and a second agent writes the editorial note: trim this, move that, put the rewatched beat in the trailer. The UI shows the retention curve with scene bands, rewinds underneath, every query as it runs, and flags the scenes the analyst names.

## How we built it
- Google ADK `SequentialAgent`: an analyst `LlmAgent` (Gemini 2.5 Pro) with an `MCPToolset` connected over stdio to `mcp-clickhouse` (`run_query`, read-only), and an editor `LlmAgent` that turns findings into recommendations. Streamed to the UI as server-sent events including tool calls.
- ClickHouse Cloud schema built for the question: `sessions` and `playback_events` feed materialized views into SummingMergeTree tables (exits/starts per second, rewind targets in 10s buckets, rebuffers per minute by CDN), plus `retention_curve` (one row per second via a range array join and window sums) and `scene_completion` (scenes range-joined to the curve with completion and loss-per-minute).
- An original eight-episode series, *Cold Harbor*, with 107 scenes, and a vectorised audience simulator that seeds story-driven behaviour: an exposition scene right after a cliffhanger, rewinds on every reveal, a post-credits tag most finishers miss, and one CDN incident that looks like a story drop.
- FastAPI on Cloud Run with Gemini through Vertex AI; the MCP server runs in its own venv inside the image.

## Challenges
ADK's MCP client pins `mcp<2` while `mcp-clickhouse` 0.6 needs `mcp>=2` — solved by running the server as an isolated stdio process. Per-second retention over millions of sessions needed the exits-not-viewers trick to keep the materialized view small. And the agent needed an explicit, ordered procedure; without the delivery-vs-story check it happily blamed a scene for a rebuffering incident.

## What we learned
Once scenes are rows with start and end seconds, "which scene" is a range join against a per-second curve, and ClickHouse makes that essentially free. The creative question and the analytical question are the same query.

## What's next
Ingest real QoE telemetry via ClickHouse's Kafka engine, scene boundaries from EDL/XML exports, A/B cuts compared on the same chart, and per-market retention for localisation notes.

## Built with
google-adk, google-genai, Gemini 2.5 Pro, Vertex AI, Cloud Run, Secret Manager, ClickHouse Cloud, mcp-clickhouse, clickhouse-connect, FastAPI, NumPy

## Links
- Hosted app: <CLOUD RUN URL>
- Repo: <GITHUB URL>
- Video: <YOUTUBE URL>
