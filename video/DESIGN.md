# Retention Room — demo video DESIGN.md
Visual + motion spec for the Remotion developer. 1920×1080, 30 fps, ≤ 180s.
Everything below is implementable as written: hex values, px sizes at 1080p, frame counts, spring configs.

Timing rule (from BRIEF.md): every scene's duration in frames = `ceil(manifest.duration_seconds * 30) + TAIL_PAD` where `TAIL_PAD = 12` frames of visual hold after the VO ends. Never hardcode durations. All entrance animations must complete within the first 15 frames of a scene so visuals are settled when the VO sentence lands.

---

## 1. Visual system

### 1.1 Palette
Derived directly from the app's CSS variables in `web/index.html` — the video must look like the product shot itself.

| Token | Hex | Use |
|---|---|---|
| `stage` | `#0F1114` | Video background. One step darker than the app bg so real screenshots (whose bg is `#1B1D21`) visibly sit ON the stage. |
| `stageVignette` | radial-gradient, `rgba(0,0,0,0)` center → `rgba(0,0,0,0.45)` at corners | Painted over `stage` on every scene. Center of gradient at 50%/42%. |
| `bg` | `#1B1D21` | App background (appears inside screenshots; also EndCard panel fills). |
| `panel` | `#22252A` | Card/panel fills (SQL panel, callout chips). |
| `panel2` | `#2A2E34` | Raised fills (chip hover states, tags). |
| `line` | `#363A41` | 1px borders, dividers, grid lines. |
| `line2` | `#44494F` | Brighter border where a panel must separate from `panel`. |
| `text` | `#E8E6E1` | Primary text. |
| `text2` | `#A7A9AE` | Secondary text, sublabels. |
| `text3` | `#6F7278` | Tertiary/metadata, axis-style labels. |
| `amber` | `#F5B83D` | THE brand accent. Retention curve, highlights, callout strokes, progress, "RETENTION ROOM" wordmark accent. |
| `amberDim` | `rgba(245,184,61,0.16)` | Amber wash fills (highlight bands). |
| `loss` | `#E5654B` | Story-problem red. Ep4 verdict stamp, "bad" numbers, flagged scenes. |
| `lossDim` | `rgba(229,101,75,0.18)` | Red wash fills. |
| `rewatch` | `#5FB3F0` | Delivery/ops blue. Ep5 verdict stamp, rewind markers, CDN/infra annotations. |
| `rewatchDim` | `rgba(95,179,240,0.18)` | Blue wash fills. |
| `stampInk` | `#101216` | Text punched out of a colored stamp fill. |

Color discipline: amber = the product & story of attention; red = story problem; blue = delivery/infrastructure. Never mix red and blue accents in the same scene except the ep5 scene where blue deliberately *replaces* an expected red (that IS the joke of the product).

### 1.2 Type stack (Google Fonts only — both already used by the app)
Load via `@remotion/google-fonts/Manrope` and `@remotion/google-fonts/JetBrainsMono`.

- **Manrope** — UI voice. Weights 500, 600, 700, 800.
- **JetBrains Mono** — data/code voice. Weights 400, 500, 700.
- Fallbacks: `system-ui, sans-serif` / `ui-monospace, monospace`.

Type scale at 1080p (px / weight / letter-spacing / line-height):
| Role | Spec |
|---|---|
| Display (TitleCard headline) | Manrope 800, 96px, -0.02em, 1.05 |
| Title-sub | Manrope 500, 34px, 0, 1.4, color `text2` |
| Kicker / eyebrow | JetBrains Mono 500, 24px, +0.14em, UPPERCASE, color `amber` |
| Verdict stamp | Manrope 800, 120px, +0.02em, UPPERCASE, single line |
| Callout label | JetBrains Mono 500, 26px, 0, 1.35 |
| Big stat (numbers like 77% → 59%) | JetBrains Mono 700, 72px |
| Stat caption | Manrope 500, 28px, color `text2` |
| SQL / code | JetBrains Mono 400, 26px, line-height 1.55; keywords may be tinted `amber`, strings `rewatch`, comments `text3` |
| Lower-third / caption | Manrope 600, 32px |
| EndCard URL | JetBrains Mono 500, 30px, color `text2` |

Minimum text size anywhere: 24px (mono kicker). Nothing smaller ever renders as video-native text. (Text *inside screenshots* may be smaller — that's what Ken Burns zoom is for.)

### 1.3 Spacing
8px base grid. Standard paddings: chips 12×20, panels 28, gaps between sibling blocks 24, section gap 48. Corner radii: screenshots 14px, panels 12px, chips 999px (pill), stamp 10px.

### 1.4 Screenshot framing
No fake browser/device chrome — the app is the hero and it's already dark; chrome is noise.
Every screenshot (`video/assets/*.png`) renders as a **Plate**:
- rounded corners 14px (`overflow: hidden`),
- 1px border `line2` at 60% opacity,
- shadow: `0 32px 90px rgba(0,0,0,0.6), 0 4px 18px rgba(0,0,0,0.4)`,
- default size: width 1688px (88% of frame) centered, on `stage` + vignette,
- a 3px `amber` hairline may be drawn along the plate's top edge at 35% opacity on hero shots only (S1, S8) — a subtle "monitor glow" signature.

Plates never sit at 100% scale — always leave stage visible so cuts read as composed shots, not raw screen recordings.

---

## 2. Motion language (read before the templates)

**One personality: "measured, damped, editorial."** This is an analytics tool for editors — moves are confident and settle without wobble. Exactly one moment per proof-beat is allowed to overshoot: the verdict stamp. Nothing else bounces.

Named spring configs (Remotion `spring()`), reuse these everywhere:
```ts
export const EASE = { damping: 200 };                            // default: critically damped, no overshoot, ~15f settle
export const EASE_SLOW = { damping: 200, stiffness: 60 };        // Ken Burns-ish drifts, panel slides, ~25f
export const STAMP = { damping: 11, stiffness: 190, mass: 0.9 }; // verdict stamp ONLY: one visible overshoot, settles ~20f
```
For non-spring interpolations use `Easing.bezier(0.22, 1, 0.36, 1)` (ease-out-quint feel) and always `extrapolateRight: 'clamp'`.

**Transitions between scenes:** default is a **straight cut** timed to VO sentence boundaries — cuts feel like an editor's bay, which is the product's world. Between *chapters* (S2→S3, S5→S6, S7→S8) use a **10-frame push**: outgoing scene slides -60px x and fades to 0 over frames 0–10 while incoming slides from +60px to 0, both with `Easing.bezier(0.22,1,0.36,1)`. Never longer than 10 frames; never vertical.

**SQL text appearance: line-by-line reveal, not per-character typing.** Per-char typing of real queries would eat the 3-minute budget. Each line: opacity 0→1 and translateY 8px→0 over 6 frames, staggered 3 frames per line (so a 10-line query fully lands in 33 frames ≈ 1.1s). While lines are still landing, a 26×4px `amber` caret block sits at the end of the newest line, blinking at 15-frame period; caret disappears 6 frames after the last line. Long queries: cap the panel at 14 visible lines and scroll (translateY) the oldest lines up as new ones land.

**Callout style (pointing at parts of a screenshot):**
1. **Halo rect** — rounded rect (radius 10px) stroked 3px `amber`, drawn around the target region by animating `strokeDashoffset` from full perimeter to 0 over 18 frames (clockwise from top-left), plus a fill of `amberDim` fading 0→1 over the same 18 frames.
2. **Connector** — 2px `amber` line from the halo's nearest edge to the label chip, growing (scaleX from anchor) over 8 frames, starting at frame 12 of the halo draw.
3. **Label chip** — pill, `panel` fill, 1px `line2` border, JetBrains Mono 26px `text`; pops in at connector completion: opacity 0→1 + scale 0.92→1 with `EASE` (8 frames).
Callouts in `loss` or `rewatch` recolor the whole assembly (halo, connector, chip border tint). Exit: whole assembly fades out over 8 frames, no reverse-draw.
Max 2 simultaneous callouts; one is almost always right.

**Ken Burns:** always a single continuous transform for the plate's inner `<Img>`: scale from A→B and translate, driven by `interpolate(frame, [0, durationInFrames], …)` with linear easing (constant drift — easing on a long pan reads as drunkenness). Scale delta ≤ 0.10 per scene (e.g. 1.02→1.10). Direction should travel *toward* the region the VO discusses.

---

## 3. Scene templates (5)

All templates accept `{ children?, durationInFrames }` and derive internal timings from `durationInFrames` only where noted; entrances are absolute-frame based.

### 3.1 `TitleCard`
Cold open + section interstitials.
- **Layout:** `AbsoluteFill` stage+vignette. Centered column, max-width 1400px: kicker (mono, amber) → headline (Manrope 800, 96px) → sub (34px, `text2`). Optional thin 2px amber rule, 160px wide, between kicker and headline.
- **Entrance:** kicker fades in frames 0–8 (opacity only). Rule scales x 0→1, frames 4–14, `EASE`. Headline rises: translateY 28px→0 + opacity 0→1, frames 6–16, `EASE`. Sub follows, frames 12–22.
- **Ambient:** entire column drifts scale 1.0→1.025 across the scene (linear).
- **Exit:** handled by the global cut/push; no self-exit.
- **VO alignment:** headline fully readable by frame 16 — first VO word ~frame 10.

### 3.2 `AppShot`
Workhorse: real screenshot with slow Ken Burns + callout annotations. Used for S1, S2, S5 and as the base layer of S4/S6.
- **Layout:** stage+vignette; Plate (per §1.4) centered, 1688px wide (or `focusScale` override). Optional lower-third caption bar bottom-left inside safe margins: pill, `panel` at 92% opacity, 1px `line`, Manrope 600 32px, 16×28 padding.
- **Entrance:** plate opacity 0→1 + scale 0.965→1, frames 0–12, `EASE_SLOW`. Lower-third slides x -24px→0 + fade, frames 8–18.
- **Ken Burns:** per §2; each use declares `from:{scale,x,y}` and `to:{scale,x,y}` in the shot table (§5).
- **Callouts:** array of `{frame, region:{x,y,w,h in source-image px}, label, color}` rendered per §2, positioned via the same transform as the image so they stick to pixels during the pan (put callouts inside the transformed container).
- **VO alignment:** trigger each callout ~5 frames before the VO names the thing, so the draw-on completes as the word lands.

### 3.3 `SplitReveal`
Screenshot + overlaid SQL/code panel. Used for S3 (agent querying) and S7 (repo/under-the-hood).
- **Layout:** plate anchored left, its center at x = 38% of frame, scaled to 1250px wide, dimmed to 78% brightness once the panel arrives. Code panel: 760×up-to-820px, right edge at 1824px (96px safe margin), vertically centered; `panel` fill at 97% opacity, 12px radius, 1px `line2`, shadow `0 24px 70px rgba(0,0,0,0.55)`. Panel header bar 56px: `bg` fill, bottom 1px `line`; left: JetBrains Mono 24px `text2` — `run_query · mcp-clickhouse`; right: a 10px dot in `amber`. Body: SQL at 26px mono, 24px padding.
- **Entrance:** plate as AppShot. Panel enters at `panelAt` frame (default 20): slides x +80px→0 + opacity 0→1 over 12 frames, `EASE`; screenshot dim (brightness 1→0.78) runs concurrently. SQL lines start revealing 6 frames after panel settles, per §2.
- **Result rows** (optional): after SQL completes, a divider (1px dashed `line`) then up to 4 result rows in 24px mono `text2`, revealing 4-frame staggered, first column tinted `text`.
- **Multiple queries** (S3 shows the agent working): panel can cycle — old SQL block slides up and fades (8 frames) as a new header+query lands; keep header persistent, swap only body. Budget ≥ 70 frames per query shown.
- **VO alignment:** panel arrival syncs to "queries ClickHouse"; each SQL swap syncs to the VO clause describing that check (device/region/CDN, rebuffering).
- **Exit:** panel slides x +60px + fade over 8 frames if the next scene reuses the same plate; otherwise global cut.

### 3.4 `VerdictStamp` — the signature beat (S4 and S6)
The one licensed overshoot. Composes ON TOP of a settled AppShot/SplitReveal.
Sequence (relative frames; `color` = `loss` for STORY PROBLEM, `rewatch` for DELIVERY INCIDENT):
1. **f0–f6 — pre-hush:** background plate dims brightness 1→0.45 and desaturates `saturate(0.6)`; any open panel drops to 30% opacity. Vignette deepens (corner alpha 0.45→0.62).
2. **f6 — impact:** stamp appears mid-flight — a rounded-rect chip (10px radius, fill `color`, text `stampInk`, Manrope 800 120px, 32×56 padding), rotated −4°, centered at 50%/46%. Scale driven by `spring(STAMP)` mapped from 1.9→1.0; opacity 0→1 over frames 6–9. The spring overshoots below 1.0 (~0.96) around f14 and settles ~f26 — that's the slam.
3. **f8–f11 — hit reaction:** whole frame (plate + stamp) shakes: translate (x,y) = (5,−3)px at f8, (−3,2) at f9, (1,−1) at f10, 0 at f11. An **impact ring** — 3px stroke `color` rounded rect 24px larger than the stamp — expands scale 1.0→1.22 while fading 0.7→0 over f8–f22.
4. **f26 — sub-line:** under the stamp, mono 28px `text2` fades in (6 frames): S4 `not a delivery problem — every check came back clean`; S6 `not the writing — one CDN edge, one region, smart TVs`.
5. **f34 — evidence stats** (S4 only): two Big Stats fade+rise (10 frames, staggered 6): `77%` captioned `watching going in` and `59%` captioned `coming out`, JetBrains Mono 72px, the 59% tinted `loss`; positioned lower-third center, 120px gap.
6. **Hold** dimmed until scene end; stamp micro-drifts scale 1.0→1.015 (linear) so it never freezes.
- **VO alignment:** f6 impact lands exactly on the VO word "Story" (S4) / "delivery" or "ops" (S6). Compute the stamp's start frame from the manifest VO timing; if word-level timing isn't available, place impact at the scene's `stampAt` value in §5 and the script-writer's word must be within ±5 frames.
- The two stamps must be *twins* — identical motion, different color + text. The rhyme is the argument: same drop shape, opposite verdict.

### 3.5 `EndCard`
- **Layout:** stage+vignette. Centered: wordmark `RETENTION ROOM` (Manrope 800, 84px, `text`, with the two O's of "ROOM" in `amber`) → 8px gap → tagline `Which scene lost them.` (Manrope 500, 36px, `text2`) → 40px → a 900×220px mini Plate showing the flagged ep4 chart crop (the red-flagged scene 13 band visible) → 32px → URL line in mono 30px `text3`: `retention-room-769027363263.us-central1.run.app`. Bottom-center, 24px mono `text3`: `ClickHouse Cloud · mcp-clickhouse · Google ADK · Gemini`.
- **Entrance:** wordmark letters do a 1-frame-per-letter opacity stagger over frames 0–14 (no movement — restraint); tagline `EASE` rise frames 10–20; plate fades frames 16–28; URL + stack line fade frames 24–34.
- **Ambient:** a 2px amber retention-curve line (traced from the real ep4 curve path) draws across the full 1920px width behind everything at 8% opacity, `strokeDashoffset` animated over the whole scene.
- **Ends** on a hold; final 15 frames fade everything to `stage`.

---

## 4. Shot map (script.json scene ids → templates)
Ids are canonical from `video/script/script.json` (8 scenes, target ~166s). Audio files: `video/audio/<id>.wav`; durations from `manifest.json` per the timing rule.

| id (target s) | Template(s) | Key params |
|---|---|---|
| `the-room` (27) | `TitleCard` (~4s) cut→ `AppShot` | Title: kicker `AGENTIC CINEMA · CLICKHOUSE TRACK`, headline `Retention Room`, sub `Which scene lost them.` AppShot: ep4 default-view PNG, KB 1.03→1.09 drifting toward the curve; callout f40 on the scene-band strip: `script scene boundaries`, amber; second callout f80 on rewind bars: `rewind hotspots`, rewatch blue. |
| `hover-the-script` (12) | `AppShot` | Hover-scene-12 PNG → 8f crossfade → hover-scene-13 PNG at the VO's "right after it". KB 1.05→1.12 into the scene card. Callout on scene card: `the script at this second`, amber. |
| `ask-the-agent` (32) | `SplitReveal` | Plate: chat-question PNG. Panel cycles 3 real queries from captures: loss-per-minute ranking → steepest-minute → device/region/CDN + rebuffer check. Lower-third: `every query on screen`. Longest scene — each SQL breathes ≥ 70 frames; result rows on query 1 and 3 (script calls for one expanded card with rows). |
| `ep4-verdict` (20) | `AppShot` + `VerdictStamp(loss)` | Plate: flagged-scene-13 PNG, KB 1.04→1.10 toward flagged band; callout f15, color loss, on scene 13 band: `scene 13 · 9 min of permit history`. `stampAt` ≈ VO "Story problem" — text `STORY PROBLEM`, stats 77/59 per §3.4. |
| `editor-note` (22) | `AppShot` | Plate: editor-note PNG, KB 1.03→1.10 slow-scrolling down the note. Callouts staggered as VO hits them: `trim`, `top rewind`, `previously-on` — amber. Lower-third: `editor agent · recut note`. |
| `ep5-refusal` (29) | `SplitReveal` + `VerdictStamp(rewatch)` | Plate: ep5 drop PNG; panel shows the CDN/device breakdown query + result rows (smart-TV/LATAM/one-CDN rows tinted `rewatch`). `stampAt` on VO "streaming ops" — text `DELIVERY INCIDENT`. Sub-line per §3.4. No stats block; callout on result row: `one CDN edge · smart TVs · LATAM`, blue. |
| `under-the-hood` (18) | `SplitReveal` ×2 quick | Two ~8s beats, straight cut between: (a) rendered code panel of real `sql/schema.sql` lines 73–113 (the four MATERIALIZED VIEWs), highlight `mv_exits_by_second`; (b) `agent/pipeline.py` around line 16 (`MCPToolset`, `StdioConnectionParams`), highlight `MCPToolset`. Line-reveal per §2; highlighted lines get an `amberDim` full-width wash over 8f. Lower-third: `ClickHouse Cloud · ADK · Cloud Run`. |
| `which-scene-lost-them` (6) | `AppShot` (~2s, flagged-scene-13 PNG, KB 1.10→1.12) 10-frame push → `EndCard` | VO "Retention Room. Which scene lost them." lands over the EndCard wordmark stagger; EndCard holds to black per §3.5. |

Chapter pushes (10f, per §2) at: `hover-the-script`→`ask-the-agent`, `editor-note`→`ep5-refusal`, `under-the-hood`→`which-scene-lost-them`. All other joins are straight cuts.
(Template sections above refer to these as S1…S8 in row order.)

---

## 5. Accessibility & legibility (hard rules)
- **Safe margins:** 96px left/right, 64px top/bottom (5%). No video-native text or callout chip outside them. Plates may bleed shadows past, never content.
- **Minimum sizes at 1080p:** video-native text ≥ 24px; SQL ≥ 26px; captions ≥ 32px; any number the VO cites ≥ 72px.
- **Contrast:** `text` on `stage`/`bg`/`panel` ≥ 12:1 ✓. `text2` on `panel` ≈ 7:1 ✓. `text3` only for decorative/metadata — never for information the VO depends on. `amber` on `stage` ≈ 9:1 ✓. Stamp text is `stampInk` on `loss`/`rewatch` fills (≈ 5.5:1 and 7:1) at 120px — passes large-text easily.
- **On-screen ≠ VO-only:** every number spoken (77%, 59%, 11:30, "one CDN edge") must also appear as rendered text or a callout.
- **Motion limits:** no flashing > 3 Hz (caret blinks at 2 Hz ✓; impact ring is a single pulse). Shake is 3 frames, ≤ 5px.
- **Reads-at-a-glance test:** any SQL panel must hold fully-revealed for ≥ 45 frames before the scene cuts.
- Screenshots must be captured at ≥ 1920px width (2× preferred) so Ken Burns at 1.12 never softens below native resolution.

---

## 6. Implementation notes for the Remotion dev
- Build tokens as a single `theme.ts` exporting the §1.1 palette, §1.2 scale, and §2 spring configs; templates import only from it.
- Use `<Series>` of scenes; each scene = `<Sequence>` sized from `manifest.json` (+12-frame tail). Chapter pushes overlap via negative offset of 10 frames.
- `<Audio>` per scene from `video/audio/<scene-id>.wav`, `startFrom={0}`, placed inside the scene Sequence so audio and visuals can never drift.
- Callout `region` coords are in source-PNG pixel space; convert with the same scale/translate transform applied to the `<Img>` (render callouts as siblings inside the transformed wrapper — they then track the Ken Burns for free).
- Preload both fonts before render; `waitUntilDone()` from `@remotion/google-fonts`.
