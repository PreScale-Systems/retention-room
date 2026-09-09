# EDITOR-NOTES — first cut review of `video/remotion/out/draft1.mp4`

Reviewer: editor. Date 2026-09-10.
Source reviewed: `video/remotion/out/draft1.mp4` — 4555 frames / 151.83s video, 151.89s audio,
1920×1080 @30, h264 + aac 48k stereo. Reviewed forensically: 76 frames at 2s intervals + 19
dense frames at scene boundaries and both verdict stamps (all in `video/review/frames/`,
contact sheets in `video/review/grids/`), plus `ffmpeg` audio extraction, `silencedetect`,
`volumedetect`, `blackdetect`, `freezedetect`, and per-frame luma sampling.

## Verdict: NOT submission-ready yet. Close, but three things would cost real points with a judge.

The spine is right and the two stamps are genuinely good — `STORY PROBLEM` and `DELIVERY INCIDENT`
are big, twinned, legible and land with weight. The SQL panels are the best thing in the cut: real
queries, real rows, 26px mono, perfectly readable at 1080p. Under budget at 151.8s against a 180s cap,
so there is ~28s of headroom to spend on fixes.

What stops it shipping today:
1. **The setup beat points at an empty box.** The "Remember that." payoff the judge told us not to
   touch is built on a callout drawn around the app's *empty-state placeholder*.
2. **The video contradicts itself on screen, twice**, at the exact proof moments (77/59 vs 81/20;
   "3–4 minutes" vs "30–40 seconds").
3. **The last 26 seconds contain 19.2 seconds of literally frozen frame** (`freezedetect` confirms
   zero motion), plus the marquee ep5 scene opens on 6.5s of mostly-black frame with an illegible
   screenshot.

None of it is hard. Every P0 is a parameter change, a re-crop, or one new capture.

### What already passes
- Audio is clean: mean −20.2 dBFS, peak −4.5 dBFS. **No clipping**, no dropouts, no glitches.
- All 8 VO tracks are present and every scene's audio is inside its own `<Sequence>` — no drift.
- **Judge fix #1 is on screen**: `77% going in` / `59% coming out` tracked callouts at 67.5s / 69.4s
  and the 72px big stats at 77.2s. (But see P0-2 — it's undermined by the screenshot behind it.)
- **Judge fix #3 is on screen**: silence measured at **120.72–122.03s (1.31s)** with the
  `DELIVERY INCIDENT` frame held static from 115.5s all the way to 125.27s. The verdict does hold
  through the beat, and the quotable line does land over the held frame. Correct.
- **Judge fix #2** is in the cut (re-rendered `ask-the-agent` VO, 28.80s, tech names fused to the
  visible tool cards).
- No SQL flashes by: every query panel holds fully-revealed for ≥ 7s, far past the 45-frame minimum.

---

## P0 — must fix before shipping

### P0-1 · `hover-the-script` (22.17–27.30s) — the callout points at an empty box
`hover-scene12.png` does not exist in `video/assets/`, so `scenes.tsx` falls back to
`hero-ep4-curve.png`, which is the app's **empty state**. From 23.9s to 27.3s the amber halo and the
chip `the script at this second` are drawn around a panel whose only text is
*"Hover the curve or pick a scene."* — see `review/frames/key_26.00.jpg`. The VO underneath is
*"Hover the curve, and you're reading the script at that exact second. Here is June's confession…"*
June's confession is never on screen at all; the crossfade to `hover-scene13.png` doesn't arrive
until 27.3s (`swapAt = round(voFrames*0.55) = 155f`).

This is the setup half of the setup/payoff the judge explicitly protected. Fix one of:
- **(preferred)** capture `hover-scene12.png` — cursor hovering inside scene 12, scene card showing
  June's confession excerpt — drop it in `video/assets/`, re-run `sync-assets.mjs`. The existing
  `crossfadeFrom: ['hover-scene12.png', 'hero-ep4-curve.png']` array will then pick it up with no
  code change.
- **(fallback, no new capture)** in `src/scenes.tsx` `HoverTheScript`, remove `hero-ep4-curve.png`
  from the fallback chain, start the scene already on `hover-scene13.png`, delay the callout to
  `frame: Math.round(scene.voFrames * 0.45)` so it draws on a populated card, and cut the "Here is
  June's confession" clause from the VO (re-render `hover-the-script.wav`).

### P0-2 · `ep4-verdict` (60.8–81.6s) — the screenshot contradicts our own callouts
`chat-findings.png`, at full contrast in the right-hand column for the entire scene, reads:
> "Episode 4 loses viewers during a long exposition scene, **dropping from 81% to 20%** retention
> in the minute starting at 2531s in scene 13."

Our callouts and the stamp's big stats say **77% → 59%**. Both are legible simultaneously in
`review/frames/key_69.50.jpg` and `key_77.60.jpg`. A judge reading the frame sees two different
numbers for the same claim. Same contradiction persists through `editor-note` (81.6–100.0s), where
the note text says "retention plummets from 81% to 20%".

Fix — pick one and make the whole video agree:
- **(preferred)** Reframe/crop the plate in `Ep4Verdict` so the analyst prose column is out of shot:
  punch in on the chart (drop the plate's right ~30%, e.g. `focusScale` / Ken Burns `to.x` positive
  instead of `-70`) so 77/59 are the only numbers on screen. Do the same for the `editor-note` shot
  where it quotes 81/20.
- **(alternative)** Change the VO + callouts + stats to 81% → 20% to match the real agent output.
  That also fixes the geometry problem in P1-3.

### P0-3 · `ep4-verdict` 80.1s vs `editor-note` 86.7s — "3–4 minutes" vs "30–40 seconds"
VO at ~80.1s: *"…and the fix is a trim: three to four minutes."* 6.6 seconds later the amber callout
chip in `editor-note` reads **`trim 30–40 seconds`**, pointing at the real note text
*"trimming Gil's monologue by 30-40 seconds"*. The video contradicts itself within seven seconds,
both times in text.

`video/BRIEF.md` claims "trim 3–4 min"; the captured app says 30–40 seconds. **The app is the source
of truth on camera.** Change the `ep4-verdict` VO line to *"and the fix is a trim: thirty to forty
seconds"* and re-render `ep4-verdict.wav`; leave the callout as-is. (Note the sound agent has already
re-rendered this scene once — see P0-7.)

### P0-4 · `ep5-refusal` (99.67–106.23s) — 6.5s of empty black on the marquee scene
`Ep5Refusal` sets `width: 1080` + `plateCenterFrac: 0.31`, and `panelAt = round(voFrames*0.26) = 197f`.
Result: for the first **6.5 seconds** the ep5 screenshot sits as a 1080×608 postage stamp in the
upper-left with roughly 785px of pure black to its right and 225px above/below — see
`review/frames/key_102.00.jpg` and `key_105.80.jpg`. Average frame luma in that window is **2–7 / 255**.
Every word of the agent's answer ("This is a **streaming issue**, not a story problem",
"smart TVs in Latin America using the `edge-c` CDN") is rendered at ~56% scale and unreadable at 1080p,
and its right edge is clipped mid-sentence by the plate. This is the scene the brief calls the
marquee moment.

Fix in `src/scenes.tsx` `Ep5Refusal`:
- Before the panel arrives, show the plate **full width** (1688px, per DESIGN §1.4) — i.e. start as a
  normal AppShot framing and only shrink/shift to `plateCenterFrac: 0.31` as the panel slides in
  (animate plate width 1688→1080 and centre 0.5→0.31 over the 12 frames of the panel entrance).
- Bring the panel in earlier: `panelAt` ≈ `Math.round(vo * 0.14)` (~106f → 103.2s) so the void is ≤ 3s.
- Set the plate's Ken Burns so the analyst answer column is the region we punch into, not clipped:
  the current `to: {x: 55}` pushes the answer text off the plate's right edge.

### P0-5 · `under-the-hood` + `which-scene-lost-them` — 19.2s of literally frozen frame in the last 26s
`ffmpeg freezedetect` (zero inter-frame motion, not just "slow"):
| freeze start | duration | end | where |
|---|---|---|---|
| 127.33s | **7.20s** | 134.53s | `under-the-hood` beat A (`sql/schema.sql`) |
| 136.40s | **7.07s** | 143.47s | `under-the-hood` beat B (`agent/pipeline.py`) |
| 146.50s | **4.90s** | 151.40s | `EndCard` |

DESIGN §2 requires a continuous drift on every shot ("stamp micro-drifts … so it never freezes").
The code panels have none. Combined with only 2.4s of VO across the final 8.4s, the video visibly
dies on the runway.

Fix in `src/templates/SplitReveal.tsx` (code mode) and `src/templates/EndCard.tsx`:
- Add a linear ambient drift to the code panel across each beat — `scale 1.0 → 1.02` plus a
  `translateY 0 → −18px` slow scroll of the code body, driven by
  `interpolate(frame, [0, durationInFrames], …)`, linear (per DESIGN §2 Ken Burns rule).
- Give the EndCard its own drift: the wordmark column `scale 1.0 → 1.015` and let the ambient
  retention-curve `strokeDashoffset` keep animating to the last frame (it currently completes early —
  see P2-6).
- Shorten the dead tail: `END_EXTRA['which-scene-lost-them']` is **168 frames (5.6s)** on top of a
  2.4s VO. Cut to ~90 frames (3.0s) — that alone removes ~2.6s of the freeze.

### P0-6 · Every "straight cut" is actually a dip to black
Measured average frame luma (0–255) at each join:

| join | t | luma before → at cut → recovery |
|---|---|---|
| TitleCard → dashboard (inside `the-room`) | **4.00s** | 5 → **0** (4 frames) → 23 by 4.40s |
| `the-room` → `hover-the-script` | 22.17s | 23 → **1** → 23 by 22.60s |
| `hover-the-script` → `ask-the-agent` | 31.67s | — → **~1** → recovered by 31.80s |
| `ask-the-agent` → `ep4-verdict` | 60.80s | 17 → **0** → 28 by 61.30s |
| `ep4-verdict` → `editor-note` | 81.60s | 18 → **0** → 27 by 82.00s |
| `editor-note` → `ep5-refusal` | 99.73s | 29 → **2** → 7 by 100.0s |
| beat A of `under-the-hood` | 125.27s | 23 → **0 for 0.75s** → 9 by 126.2s |
| beat B of `under-the-hood` | 134.53s | 16 → **0 for 0.6s** → 10 by 135.5s |
| EndCard | 145.50s | 28 → **1** → 10 by 146.5s |

Cause: `AppShot` / `SplitReveal` both enter at `opacity 0` (`0.965→1` scale + fade over 12f,
`EASE_SLOW`), so every scene *and* every internal `<Sequence>` swap starts from black on a black
stage. DESIGN §2 says the default join is a **straight cut**. Right now the whole cut blinks.

Fix: in `AppShot` and `SplitReveal`, make the entrance fade **conditional** — add an
`entrance?: 'fade' | 'none'` prop defaulting to `'none'`, and only pass `'fade'` on the very first
shot of the video. Keep the 0.965→1 scale settle if you want the settle feel; just don't start at
opacity 0. Specifically:
- `TheRoom`: the inner `<Sequence from={TITLE_FRAMES}>` must be a hard cut (`entrance: 'none'`) — the
  0.4s black hole at 4.0s is the most visible one because it lands right after the title card.
- `UnderTheHood`: both halves must be hard cuts, and the code panel should start already at
  full opacity with only the *lines* revealing (the 0.75s and 0.6s of pure black at 125.3s and
  134.5s are the worst frames in the video — see `review/frames/key_126.00.jpg`).
- `EndCard`: cross-dissolve from the chart shot rather than through black.

### P0-7 · The draft is already stale — `manifest.json` changed under it
`video/audio/manifest.json` now reports **`ep4-verdict` = 18.64s**; `draft1.mp4` was rendered from
20.40s. Re-running `sync-assets.mjs` + render will shorten `ep4-verdict` by 53 frames and shift every
scene after 81.6s earlier by 1.77s. Because every timing in `ep4-verdict` and `ep5-refusal` is a
**fraction of `voFrames`**, the stamp and callout positions will all move. After the re-render,
re-verify P1-1 and P1-2 against the new WAV before locking.
Also note: the draft's `ep4-verdict` VO has a **1.26s dead pause** at 62.34–63.54s ("The verdict comes
back. […] Scene thirteen…") — presumably why it was re-cut. Confirm it's gone in the new WAV.

---

## P1 — should fix

### P1-1 · `ep5-refusal` — the stamp slams ~1.3s before the word
Measured VO structure inside the scene (offsets from scene start 99.667s):
| clause | offset |
|---|---|
| "…on a single CDN edge, rebuffering." | 11.43 → **16.24s** |
| "**Verdict: delivery incident.**" | **16.71 → 18.35s** |
| "Hand it to streaming ops, and don't touch the cut." | 18.75 → 21.10s |
| *[silence 1.33s]* | 21.10 → 22.43s |
| "That's the difference between a dashboard and an analyst." | 22.82 → 25.18s |

`stampAt = round(756*0.62) = 469f`, impact at `469+6 = 475f = 15.83s` → **absolute 115.50s**. The slam
lands while the narrator is still finishing "…rebuffering", ~0.9s before "Verdict" and ~1.6s before
"delivery". DESIGN §3.4 requires ±5 frames.
Fix: `stampAt = Math.round(vo * 0.682)` (→ 516f, impact at 522f = 17.40s = the word "delivery").
Re-derive after the P0-7 re-render if the WAV changes.

### P1-2 · `ep4-verdict` — the 77% / 59% callouts arrive 2–4s before the VO says them
Measured (offsets from scene start 60.8s, current 20.4s WAV):
- "Seventy-seven percent of the audience watching going in" → **9.06s**; callout fires at
  `round(612*0.33) = 202f = 6.73s` — **2.3s early**.
- "fifty-nine coming out" → **12.20s**; callout fires at `round(612*0.42) = 257f = 8.57s` —
  **3.6s early**.

DESIGN §3.2 says trigger ~5 frames before the word. Fix: `0.33 → 0.436` and `0.42 → 0.590`
(equivalently frames 267 and 361 on the 20.4s WAV). **Re-measure against the new 18.64s WAV** — with
the pause removed these ratios will not carry over.

### P1-3 · `ep4-verdict` — the `59%` halo points at a spot on the curve reading ~68%
The two small halo rects (`region {x:1026,y:198}` and `{x:1264,y:264}`) sit *on the retention curve*,
which reads the callout as "the curve is at 77% here / 59% there". At the second halo (~43:00) the
curve is visibly around 68%, not 59% — see `key_69.50.jpg`. 77/59 are `scene_completion` values, not
curve readings, so anchoring them to curve pixels invites a judge to check and find them wrong.
Fix: anchor both halos to the scene-13 **band edges** (the vertical boundaries of the red band) rather
than to points on the curve, or relabel to `77% enter scene 13` / `59% finish scene 13`.

Related: the Ken Burns `to.x = -70` on this scene **crops the chart's y-axis labels** (100 / 75 / 50 /
25%) out of frame for the whole scene — the one moment the VO is quoting percentages, the axis is gone.
Reduce the pan to `x: -20` or shift the plate right.

### P1-4 · `ep5-refusal` — the required result-row callout never renders
`Ep5Refusal` passes `highlightRowChip: 'one CDN edge · smart TVs · LATAM'`, and `CodePanel.tsx:237`
implements it, but no chip appears anywhere in the scene (checked 108s, 110s, 112s, 114s —
`key_112.00.jpg`). The `smart_tv / LATAM / edge-c / 127` row is tinted blue but unannotated.
DESIGN §4 requires the callout. Debug the render path (likely a frame-window or z-index/overflow
issue) — this is the single row that proves the whole refusal.

### P1-5 · `under-the-hood` — the top code line is sliced in half, and the schema highlight is gone
`CodePanel` caps at `MAX_VISIBLE = 14` and scrolls by whole lines, but the panel body has no top
padding for the partial row, so from 128s onward the first visible line is cut through its x-height:
`SELECT episode, end_sec AS second, device, region,` with the top half missing. Same in beat B.
See `review/grids/g16.jpg` / `g17.jpg`.
Also: DESIGN §4 asks for `mv_exits_by_second` to be highlighted in beat A. By the time
`highlightAt` fires, that line has scrolled off the top — no amber wash is ever visible in beat A.
(Beat B's `return MCPToolset(` highlight works correctly.)
Fix: add a `clip` mask + 12px top inset so partial lines are hidden rather than sliced; and either
shorten `SCHEMA_EXCERPT` to ≤14 lines so nothing scrolls, or move the highlight to a line that
survives in the final window.

### P1-6 · Every AppShot slices the app's header mid-word
Because plates are cropped by the Ken Burns scale (1.03–1.12) with a leftward pan, `RETENTION ROOM`
reads as `NTION ROOM` / `TROOM`, and `Episode 4 — Harbor Deepening` as `ode 4 —` / `e 4 —`, in nearly
every scene (`key_23.00.jpg`, `key_69.50.jpg`, `key_26.00.jpg`, grids g01–g03, g08–g12). Sliced
wordmarks read as a badly framed screen grab, not a composed shot.
Fix: either reduce the starting scale to 1.00 and keep pans ≤ ±30px so the header stays whole, or
deliberately crop *below* the header row so no half-word is visible.

### P1-7 · `ep5-refusal` — `drop at 11:30` points at a flat piece of the curve
The blue halo is drawn over ~10:30–13:30 on the ep5 chart, where the aggregate curve is visibly flat
(~80%). The only visible cliff on that chart is at ~40:00 (credits). A judge looking where we point
sees no drop. (The real drop is segment-level — smart TV / LATAM / edge-c — which the aggregate curve
can't show.)
Fix: relabel the chip to `11:30 — smart-TV/LATAM segment` (honest and it sets up the payoff), or move
the callout to the rebuffer evidence in the result rows instead of the curve.

### P1-8 · `editor-note` — VO says "confession", the note on screen says "truck reveal"
VO (≈96s): *"…since the confession is the episode's single most rewound moment, put it in the
previously-on."* The note under our `previously-on` callout reads *"The audience also loves the dashcam
and truck identification scenes; let's use the truck reveal for the 'previously on'."*
Fix: retarget the `previously-on` callout region to the "rewatch hotspot" sentence, or amend the VO to
*"put the rewatch hotspot in the previously-on"* (re-render `editor-note.wav`).

### P1-9 · `ask-the-agent` — two long static holds
`beats` are at frames 20 / 346 / 570 of an 876-frame scene, so query 1 sits fully-revealed and
motionless for **~10.9s** and query 3 for **~9.8s**. There is a slow Ken Burns on the plate behind, so
`freezedetect` doesn't flag it, but it reads static. DESIGN §3.3 budgets ≥70 frames per query — we're
at 4–5× that.
Fix: rebalance to four beats (add the rebuffer-check query from `chat-tool-cards.png`) at roughly
`20 / 0.28 / 0.50 / 0.72` of `voFrames`, ~6–7s each.

### P1-10 · `ep4-verdict` — the 77% / 59% big stats have no scrim
At 77.6s the two 72px stats sit directly over the app's scene-card grid; the underlying text
(`13 · exposition · 34:10`, `INT. HARBORMASTER'S OFFICE - NIGHT`) reads *through* the numbers, and the
`59%` in `loss` red is noticeably dimmer than the white `77%` — see `key_77.60.jpg`. The judge's whole
point was that these numbers must be unmissable.
Fix: put both stats on a `panel`-fill pill (or a 60%-opacity `stage` scrim, radius 12, padding 28) and
lift the stats layer above the scene's dim so `59%` renders at full `loss` chroma.

### P1-11 · No breath at the three chapter pushes
Scene padding is 12 frames (0.4s) but a chapter push subtracts 10, leaving **0.067s** between the
outgoing VO's last word and the incoming VO's first. `silencedetect` finds no gap at all across
31.53s (`hover` → `ask`) or 99.6s (`editor-note` → `ep5`) — the narrator runs straight through the
transition. It rushes the two most important handoffs in the video.
Fix: raise `TAIL_PAD` to 24 for scenes that push out (`pushOut === true`), or add ~0.4s of leading
silence to the `ask-the-agent` and `ep5-refusal` WAVs. Budget allows it — we're 28s under cap.

### P1-12 · `EndCard` mini-plate is half a clipped paragraph
The 900×220 crop of `chat-findings.png` is ~60% chart and ~40% a slab of analyst prose clipped
mid-word on both edges ("This is a **story problem**. The a…") — `key_148.00.jpg`. DESIGN §3.5 asks for
*the flagged ep4 chart crop*. Fix: crop to chart-only (source x ≈ 60–1440, y ≈ 170–560) so the red
scene-13 band is the whole image.

---

## P2 — nice to have

1. **No music or ambient bed anywhere.** Mean level −20.2 dBFS with long true silences (2.37s at
   143.3–145.7s, 3.89s at 148.0–151.9s). Silence over a frozen frame reads as a technical failure, not
   a beat. A −28 LUFS pad under the whole thing would buy a lot of perceived production value and make
   the ep5 1.2s pause read as *deliberate*.
2. **Opening frame is black for 4 frames (0–0.13s) while the VO is already talking.** Start the
   TitleCard's kicker fade at frame 0 with an initial opacity of 0.2, or delay the audio by 4 frames.
3. **`ep5-refusal` panel header wraps to two lines** — `run_query · mcp-clickhouse · break down the /
   exits` — and the wrapped word crowds the SQL body. Shorten the beat title to `break down exits`.
4. **`region = NA` in the ep4 delivery-check rows reads as null/missing data**, not "North America",
   right when the VO says the delivery checks came back clean. Relabel in `realdata.ts` to `NA (N.Am.)`
   or drop the region column for that query.
5. **`chat-editor-note.png` has a stray truncated SQL block** at the top of the chat column
   (`WHERE sh.episode = 4 … LIMIT 5;`) that reads as leftover garbage — visible 82–100s. Pan below it
   or re-capture with the tool card collapsed.
6. **EndCard ambient curve trace stops mid-frame** at ~x=600 instead of spanning 1920px (DESIGN §3.5),
   so it looks like a broken stroke. Extend the path or let the `strokeDashoffset` run the full scene.
7. **`ask-the-agent` never shows the question being asked.** `chat-question-typed.png` is only a
   fallback in the `src` array, so it never renders. A 20-frame beat on the typed question before the
   first tool card would sell "you ask it" much better than cutting straight to results.
8. **28s of headroom under the 180s cap.** After the P0/P1 trims (−2.6s tail, −1.8s from the shorter
   ep4 VO) there's room to give `hover-the-script` and `ep5-refusal` more air rather than less.

---

---

## Addendum — `src/scenes.tsx` changed while this review was being written

The remotion dev is mid-fix. Checked against the current source, so nobody re-does work:

**Already addressed (verify in the next render, don't re-do):**
- `the-room` now uses `frameMove()` anchored to the capture's top-left so the `RETENTION ROOM`
  wordmark and episode header stay whole — this is P1-6 for that scene only.
- `editor-note` now crops to `y=548` so the "81% to 20%" paragraph is off-frame, and the three
  callout regions were tightened — this is P0-2 and P1-6 for that scene.

**Still open, unchanged in source:** P0-1 (`hover-the-script` still falls back to
`hero-ep4-curve.png`), P0-4 (`ep5-refusal` still `width: 1080` + `panelAt = vo*0.26`), P0-5 (no drift
on the code panels or EndCard), P0-6 (entrances still fade from opacity 0), P1-1 (`stampAt`
still `vo*0.62`), P1-2 (`0.33` / `0.42`), P1-3, P1-4, P1-5, P1-7, P1-9, P1-10, P1-12.

**P0-2 is only half fixed.** `Ep4Verdict` still renders the full `chat-findings.png` with no crop, so
"dropping from 81% to 20%" is still legible in the right column for the whole 20s of the proof scene,
directly beside the big stats. Apply the same `frameMove()` crop treatment there.

**The number changed to 76% and the VO already agrees.** The callout and the big stat were changed
`77%` → `76%` (verified 75.5% at scene entry), and `sound` has re-cut `ep4-verdict.wav` to
*"Seventy-six percent … fifty-nine coming out"* (18.64s). Nothing to do here — but
**`video/BRIEF.md` still says "77% → 59%"**; update it so a later agent doesn't revert the correction.
Everywhere `77%` appears in this document, read `76%`.

**Note for P0-3:** `ep4-verdict.wav` was just re-rendered for the 76% fix but the "three to four
minutes" line was *not* changed. That re-render is still needed — fold it into the same pass.

## Re-render checklist
1. Capture `hover-scene12.png` (P0-1); re-crop the ep4/editor plates (P0-2).
2. Re-render `ep4-verdict.wav` with the "thirty to forty seconds" line (P0-3).
3. Apply P0-4/5/6 code changes; `node sync-assets.mjs`; `npm run render`.
4. Re-measure with `silencedetect` and re-check P1-1 / P1-2 stamp + callout frames against the new
   `ep4-verdict` and any re-rendered WAVs — all of those timings are `voFrames` fractions and will move.
5. Re-run `freezedetect` and the per-cut luma sample to confirm P0-5 and P0-6 are actually gone.
