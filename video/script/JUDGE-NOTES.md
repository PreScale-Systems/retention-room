# Judge notes — script review before voiceover

Reviewer role: hackathon judge (Devpost, ClickHouse track lens). Reviewed `video/script/script.md`
against `video/BRIEF.md`, `DEVPOST.md`, `README.md`, and `video/STATUS.md`.

## Verdict: 8.5 / 10

This is a strong script — top-decile for a hackathon submission. The problem statement lands in
two sentences, real software is on screen from frame one, the setup/payoff structure ("Remember
that." → scene 13 flagged) is genuinely cinematic, ep5 is correctly positioned as the marquee,
and there is a quotable line a judge will repeat: **"That's the difference between a dashboard
and an analyst."** The 6-word outro is confident. Nothing here pads; 144s of measured VO under a
178s cap is the right instinct.

Scene-by-scene against the criteria:

1. **Cold-viewer clarity in 15s** — PASS. "Editors get retention as a number. Data teams don't
   read scripts. Nobody in the edit knows which scene lost them." ~10 seconds, no jargon.
2. **Working software by 0:40** — PASS. The real app is the very first frame; the agent
   interaction starts at ~0:39. (Do not let the title beat delay the dashboard.)
3. **Proof moments** — ep4 lands (numbers, clean-delivery contrast, concrete fix). ep5 is
   correctly the wow and the VO builds to the quotable. Two fixes below make both land harder.
4. **Sponsor tech naming** — mostly natural. Scene 3 has one checklist-adjacent sentence and one
   redundancy (fix #2). Scene 7 earns its 18s by naming real artifacts (schema.sql, MCPToolset).
5. **Pacing** — no scene drags. One VO/screen fight: scene 4's conditional stage direction
   (fix #1). Scene 7 after the emotional peak is the standard proof-the-tech slot; keep it.
6. **Memorable line** — PASS, twice ("dashboard and an analyst"; "The audience already told you
   what they love").

## The 3 changes with highest impact

### 1. Scene 4 (ep4-verdict): commit to the number — kill the hedge
The direction currently reads:

> Punch in on "77% → 59%" if the UI shows it; otherwise hold the flagged scene band.

A conditional stage direction on your proof moment number is how the punch gets silently dropped
in production. The values are verified real data (README: 77% → 59% inside scene 13), and
DESIGN.md's AppShot template already supports tracked callouts. Replace with:

> Punch in on scene 13's band; overlay tracked callouts "77%" at the scene entry and "59%" at
> the exit (real values from `scene_completion`), timed to the VO. The number must be on screen,
> not only in the ear.

No VO change; no re-render needed.

### 2. Scene 3 (ask-the-agent): fuse the tech names to what's on screen, cut the duplicate
Current VO has the one checklist-adjacent moment and a redundancy — the last sentence restates
what the on-screen direction already shows. Replace these two sentences:

> A Gemini analyst agent, built with Google's Agent Development Kit, queries ClickHouse Cloud
> through the official MCP server.

> Every SQL query it runs appears on screen, as it runs.

with (first sentence, timed as tool cards stream in; second sentence deleted):

> Those cards streaming in are a Gemini agent — built with Google's ADK — sending real SQL to
> ClickHouse Cloud through the official MCP server, every query on screen as it runs.

Same facts, but now the names are captions for visible evidence instead of a spec recital, and
scene 3 drops from 78 to ~68 words — air for the SQL to be read. Re-render `ask-the-agent` only.

### 3. Scene 6 (ep5-refusal): give the marquee a beat of silence
69 words in 29s means the verdict, the ops handoff, and the best line of the video arrive as one
unbroken stream. The wow needs air. Change the on-screen direction from:

> End on the agent's "delivery incident — do not recut" verdict.

to:

> Hold on the agent's "delivery incident — do not recut" verdict, static, for a full beat of
> silence. Only then the final VO line, over the held frame.

and in the VO, mark a hard pause (TTS: split the scene's audio or insert a break) between
"…don't touch the cut." and "That's the difference between a dashboard and an analyst." Bump the
scene target 29s → 31s; the budget has 30+ seconds of slack. The line is the thing judges will
quote — let it stand alone.

## Must NOT change

- The cold open's first three sentences — best problem statement I've seen in this track.
- "Remember that." at the end of scene 2, and the payoff when scene 13 flags red. Setup/payoff
  across 40 seconds is what separates this from a feature tour.
- "That's the difference between a dashboard and an analyst." — the quotable. (Fix #3 protects
  it; do not rewrite it.)
- The 6-word outro and its beat of silence.
- Scene order: ep5 refusal before under-the-hood. The refusal is the wow; the code tour is the
  receipts. Correct sequence.
- The real-captures-only rule and showing live SQL in scene 3 — that is the ClickHouse-track
  credibility in one shot.

Everything else stands as written. Apply the three fixes and this is a 9+ script.
