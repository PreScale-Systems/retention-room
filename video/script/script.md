# Retention Room — final VO script (3-minute demo)

8 scenes. 384 spoken words (judge fixes applied, 2026-09-09). At a natural 150 wpm
that is ~155 seconds of VO including the scripted 1.2s pause; scene targets below
total 168 seconds, leaving 10 seconds of breathing room under the 178-second cap. All numbers verified against `video/BRIEF.md`. All on-screen
footage is real app captures per the brief (no mockups).

Timing truth lives in `video/audio/manifest.json` once VO is recorded —
`target_seconds` here are planning targets, not final durations.

---

## 1. the-room — target 27s (65 words)

**On screen:** Real app, episode 4 default view: the retention curve with scene
bands laid over it, rewind hotspots underneath. Slow push-in on the curve; let
the dashboard breathe before the title beat on "Retention Room."

**VO:**
Editors get audience retention as a number on a dashboard. Data teams don't read
scripts. So when an episode bleeds viewers at minute thirty-four, nobody in the
edit knows which scene lost them. This is episode four of Cold Harbor — its
retention curve, with the script's scene boundaries laid right over it. That's
Retention Room: the data and the script, in the same room.

---

## 2. hover-the-script — target 12s (28 words)

**On screen:** Cursor hovers across the curve from scene 12 into scene 13; the
scene card updates live — slugline and excerpt for June's confession, then the
scene after it. Hold a beat on the card for scene 13.

**VO:**
Hover the curve, and you're reading the script at that exact second. Here is
June's confession — and here's the scene that comes right after it. Remember
that.

---

## 3. ask-the-agent — target 32s (77 words)

**On screen:** Type "Why does this episode lose people?" into the chat. Tool
cards stream in: `run_query` via mcp-clickhouse, real SQL visible in each card.
Expand one card to show returned rows. Keep the SQL legible — this is the
required-tech beat.

**VO:**
Now ask it: why does this episode lose people? Those cards streaming in are a
Gemini agent — built with Google's ADK — sending real SQL to ClickHouse Cloud
through the official MCP server, every query on screen as it runs. It follows a
fixed procedure: rank every scene by loss per minute, find the steepest sixty
seconds, and — before it's allowed to blame the writing — break the exits down
by device, region, and CDN, and check for rebuffering.

---

## 4. ep4-verdict — target 20s (48 words)

**On screen:** Analyst findings arrive in chat; scene 13 flags red on the chart.
Punch in on scene 13's band; overlay tracked callouts "76%" at the scene entry
and "59%" at the exit (real values from `scene_completion`), timed to the VO.
The number must be on screen, not only in the ear. Proof moment one — land it
hard.

**VO:**
The verdict comes back. Scene thirteen: nine minutes of dredging-permit history,
dropped immediately after June's confession. Seventy-six percent of the
audience watching going in — fifty-nine coming out. The delivery checks are
clean. This is a story problem, and the fix is a trim: three to four minutes.

---

## 5. editor-note — target 22s (55 words)

**On screen:** The editor agent's note streams in below the analyst findings.
Slow scroll through the recommendations; underline or highlight "top rewind" and
the previously-on suggestion as the VO hits them.

**VO:**
A second agent — the editor — turns those findings into a note you can take into
the cutting room: trim the permit scene, move the history where it can breathe,
and since the confession is the episode's single most rewound moment, put it in
the previously-on. The audience already told you what they love.

---

## 6. ep5-refusal — target 31s (68 words + 1.2s scripted pause)

**On screen:** Switch to episode 5. Ask "Is the drop at 11:30 the story or the
stream?" Show the drop on the curve, then the device/region/CDN breakdown result
rows: smart_tv, LATAM, edge-c, rebuffers. Hold on the agent's "delivery incident
— do not recut" verdict, static, for a full beat of silence. Only then the final
VO line, over the held frame. Proof moment two — the marquee beat.

**VO:**
Episode five has a drop that looks exactly the same. Is it the story, or the
stream? The agent runs the same checks — and this time it refuses to blame the
writing. The exits are smart TVs, in Latin America, on a single CDN edge,
rebuffering. Verdict: delivery incident. Hand it to streaming ops, and don't
touch the cut. [PAUSE 1.2s] That's the difference between a dashboard and an
analyst.

---

## 7. under-the-hood — target 18s (42 words)

**On screen:** Quick repo tour: `sql/schema.sql` materialized views, then
`agent/pipeline.py` with the `MCPToolset` wiring. Real code from the repo, two
clean holds — no fast scrolling.

**VO:**
Under the hood: twenty-three million playback events across sixty thousand pilot
sessions, in ClickHouse Cloud. Materialized views keep exits, rewinds, and
rebuffers pre-aggregated, so per-second retention is a millisecond query. And
the whole thing is one ADK agent pipeline on Cloud Run.

---

## 8. which-scene-lost-them — target 6s (6 words)

**On screen:** Back to the episode 4 chart with scene 13 flagged red. Hold, then
the title card: "Retention Room — which scene lost them." Beat of silence before
the end.

**VO:**
Retention Room. Which scene lost them.

---

## Totals

| # | scene id | words | target_seconds |
|---|---|---|---|
| 1 | the-room | 65 | 27 |
| 2 | hover-the-script | 28 | 12 |
| 3 | ask-the-agent | 77 | 32 |
| 4 | ep4-verdict | 48 | 20 |
| 5 | editor-note | 55 | 22 |
| 6 | ep5-refusal | 68 | 31 |
| 7 | under-the-hood | 42 | 18 |
| 8 | which-scene-lost-them | 6 | 6 |
| | **total** | **384** | **168** |

384 words / 150 wpm + 1.2s pause = ~155s spoken; 168s with per-scene breathing room; cap 178s.

Judge fixes (JUDGE-NOTES.md) applied to scenes ask-the-agent (VO), ep4-verdict
(on-screen only), ep5-refusal (VO pause marker + on-screen + target). The [PAUSE 1.2s]
marker in scene 6 is a direction for the sound agent, not spoken text.
