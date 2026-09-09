# Retention Room — 3-minute hackathon demo video: shared production brief

Every agent on this production reads this file first. Shared workspace: `video/` in this repo.

## The product (30 seconds of context)
Retention Room answers "which scene lost them?" for a streaming series. A Gemini analyst agent
(Google ADK) queries ClickHouse Cloud through the official `mcp-clickhouse` MCP server, finds where
audiences drop off, rules out CDN/delivery problems before blaming the writing, reads the script at
that timestamp, and an editor agent writes the recut note. Built for the Agentic Cinema hackathon,
ClickHouse track. Read `README.md`, `DEVPOST.md`, and `VIDEO.md` (the human-written shot list — the
narrative spine; improve on it, don't discard it).

## Facts the video can use (all verified live)
- Live app: https://retention-room-769027363263.us-central1.run.app (also http://localhost:8081)
- Series: *Cold Harbor*, 8 episodes, 105 scenes, 23.1M playback events, 60k pilot sessions
- Ep 4 "Harbor Deepening": permit-exposition scene right after June's confession bleeds viewers;
  the confession is the episode's top rewind. Agent verdict: story problem — trim ~30–40 s off Gil's monologue (the app's own words — VO must match).
  VERIFIED against the live DB (2026-09-10): scene 13 spans 2050s–2590s; retention 75.5% at the
  scene entry → 59.0% at the exit; scene completion 78.2%; 2.43 pp lost per minute. Say "seventy-six
  percent going in, fifty-nine coming out". Do NOT use the older 77% figure.
- Ep 5 "Edge of the Chart": drop at ~11:30–12:00 is smart-TV/LATAM/one-CDN rebuffering; agent
  verdict: delivery incident, hand to streaming ops, don't recut. (Marquee moment — the agent
  refuses to blame the writing.)
- Every SQL query the agent runs is shown in the UI as it happens.

## Deliverables & owners
- `video/script/` — script-writer: `script.md` (VO + on-screen directions) and `script.json`
  (array of scenes: id, vo_text, on_screen, target_seconds; total ≤ 178s of VO at ~150 wpm).
- `video/audio/` — sound: one WAV per scene named `<scene-id>.wav` + `manifest.json`
  (scene id → file, duration_seconds measured with ffprobe). TTS: Pocket TTS preferred.
- `video/assets/` — footage: PNG screenshots of the real app (naming: `<what>-<state>.png`) +
  `assets.json` describing each.
- `video/DESIGN.md` — designer: visual system + per-scene motion spec for the Remotion dev.
- `video/remotion/` — remotion-dev: the Remotion project. Final render → `video/out/final.mp4`,
  1920×1080 30fps, ≤ 3:00.

## House rules
- 16:9 1080p. Dark UI-friendly palette (the app UI is dark). No fake screenshots of the app —
  use real captures from `video/assets/`. Code/SQL shown must be real (from the repo or captures).
- Timing truth lives in `video/audio/manifest.json` — the Remotion comp derives scene durations
  from measured audio, never hardcoded guesses.
- Write status notes to `video/STATUS.md` (append, with your role name) so other agents can see
  where things stand.
