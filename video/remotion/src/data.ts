import {staticFile} from 'remotion';

// ---- Shared production data types (see video/BRIEF.md + DESIGN.md) ----

export type ScriptScene = {
  id: string;
  vo_text: string;
  on_screen: string;
  target_seconds: number;
};

export type ManifestEntry = {
  file: string;
  duration_seconds: number;
};

export type AudioManifest = Record<string, ManifestEntry>;

// A fully-resolved scene placed on the timeline.
export type ResolvedScene = ScriptScene & {
  audioSrc: string | null;
  voFrames: number; // frames of actual VO (ceil(duration_seconds * fps))
  durationInFrames: number; // voFrames + TAIL_PAD (+ extra hold on the last scene)
  startFrame: number; // absolute position in the composition
  pushIn: boolean; // this scene enters with a 10-frame chapter push
  pushOut: boolean; // this scene exits with a 10-frame chapter push
};

export type MainData = {
  scenes: ResolvedScene[];
  assets: string[]; // filenames present in public/assets/
};

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// DESIGN.md timing rule: frames = ceil(duration_seconds * 30) + TAIL_PAD.
export const TAIL_PAD = 12;
// EDITOR P1-11: a chapter push subtracts 10 of those 12 frames, leaving 0.067s
// between the outgoing VO's last word and the incoming scene's first — the
// narrator ran straight through the two most important handoffs. Scenes that
// push out get a real breath instead.
export const TAIL_PAD_PUSH = 26;
// DESIGN.md §2: 10-frame chapter push, overlapping via negative offset.
export const PUSH = 10;
// Chapter pushes occur INTO these scene ids (§4).
const PUSH_INTO = new Set(['ask-the-agent', 'ep5-refusal', 'which-scene-lost-them']);
// The final scene holds the EndCard well past its 2.4s VO (§3.5 hold + fade;
// the AppShot beat + wordmark + URL need room to land).
// EDITOR P0-5: 168 frames (5.6s) of hold on top of a 2.4s VO was 4.9s of
// literally frozen EndCard. 90 frames (3.0s) with the new EndCard drift.
const END_EXTRA: Record<string, number> = {'which-scene-lost-them': 90};

const normalizeManifest = (raw: unknown): AudioManifest => {
  if (Array.isArray(raw)) {
    const out: AudioManifest = {};
    for (const entry of raw as Array<ManifestEntry & {id: string}>) {
      out[entry.id] = {file: entry.file, duration_seconds: entry.duration_seconds};
    }
    return out;
  }
  return (raw ?? {}) as AudioManifest;
};

const normalizeScript = (raw: unknown): ScriptScene[] => {
  if (Array.isArray(raw)) return raw as ScriptScene[];
  const obj = raw as {scenes?: ScriptScene[]};
  return obj?.scenes ?? [];
};

export const loadMainData = async (): Promise<MainData> => {
  const [scriptRes, manifestRes, assetsRes] = await Promise.all([
    fetch(staticFile('script.json')),
    fetch(staticFile('manifest.json')),
    fetch(staticFile('asset-index.json')),
  ]);
  if (!scriptRes.ok) {
    throw new Error(
      'Could not load script.json — run `node sync-assets.mjs` (needs video/script/script.json)',
    );
  }
  const script = normalizeScript(await scriptRes.json());
  const manifest = manifestRes.ok ? normalizeManifest(await manifestRes.json()) : {};
  const assets: string[] = assetsRes.ok ? await assetsRes.json() : [];

  let cursor = 0;
  const scenes: ResolvedScene[] = script.map((scene, i) => {
    const audio = manifest[scene.id];
    // Timing truth: measured audio from the manifest; target_seconds only as
    // a fallback while a scene's VO has not been rendered yet.
    const voSeconds = audio?.duration_seconds ?? scene.target_seconds ?? 5;
    const voFrames = Math.max(1, Math.ceil(voSeconds * FPS));
    const pushIn = PUSH_INTO.has(scene.id);
    const nextId = script[i + 1]?.id;
    const pushOut = nextId ? PUSH_INTO.has(nextId) : false;
    const durationInFrames =
      voFrames + (pushOut ? TAIL_PAD_PUSH : TAIL_PAD) + (END_EXTRA[scene.id] ?? 0);
    if (pushIn) cursor -= PUSH; // overlap with the outgoing scene
    const startFrame = cursor;
    cursor += durationInFrames;
    return {
      ...scene,
      audioSrc: audio ? staticFile(`audio/${audio.file}`) : null,
      voFrames,
      durationInFrames,
      startFrame,
      pushIn,
      pushOut,
    };
  });

  return {scenes, assets};
};

export const totalDurationInFrames = (scenes: ResolvedScene[]): number =>
  Math.max(1, ...scenes.map((s) => s.startFrame + s.durationInFrames));
