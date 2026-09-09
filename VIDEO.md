# 3-minute demo — shot list

Open on episode 4 (the app defaults there). Have one answer pre-run in a second tab as a fallback.

| Time | On screen | Say |
|---|---|---|
| 0:00–0:20 | The room: ep 4 curve with scene bands, rewinds underneath | "This is the retention curve for episode four of *Cold Harbor*, with the script's scene boundaries laid over it. Editors see the number; they don't usually see the scene. Retention Room puts both in the same room." |
| 0:20–0:35 | Hover the curve across scene 12 → 13; the scene card updates | "Hover and you're reading the script at that second. Here's June's confession — and here's what comes right after it." |
| 0:35–1:30 | Type "Why does this episode lose people?" Tool cards appear: `run_query` via mcp-clickhouse, SQL visible. Expand one to show rows. | "Ask, and a Gemini analyst queries ClickHouse through the official MCP server. It ranks scenes by loss per minute, finds the steepest minute, then — before blaming the writing — breaks exits down by device, region and CDN and checks rebuffering. Every query is on screen." |
| 1:30–1:55 | Analyst findings arrive; scene 13 flags red on the chart | "Scene thirteen: nine minutes of permit history immediately after the confession. Seventy-seven percent watching going in, fifty-nine coming out. Story problem, not delivery." |
| 1:55–2:20 | Editor note arrives | "The editor agent turns that into a note: trim the office scene, move the permit history, and the confession is the episode's top rewind — put it in the previously-on." |
| 2:20–2:40 | Switch to ep 5. Ask "Is the drop between 11:30 and 12:00 the story or the stream?" (exact range matters — vaguer phrasing can send the agent to the wrong minute) Show the CDN breakdown result. | "Episode five has a drop that looks the same. The agent finds it's one CDN edge, one region, smart TVs — and hands it to streaming ops instead of recutting a scene." |
| 2:40–2:55 | Repo: `sql/schema.sql` materialized views, `agent/pipeline.py` MCPToolset | "Under the hood: sessions and playback events into ClickHouse Cloud, materialized views for exits per second, rewinds and rebuffers, a per-second curve view, and one ADK agent network on Cloud Run." |
| 2:55–3:00 | Back to the flagged chart | "Retention Room. Which scene lost them." |
