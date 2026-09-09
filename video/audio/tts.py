#!/usr/bin/env python3
"""TTS pipeline for the Retention Room demo video.

Reads video/script/script.json (array of {id, vo_text, ...}), synthesizes one
48kHz mono WAV per scene into video/audio/<id>.wav with Pocket TTS (Kyutai),
normalizes loudness to -16 LUFS with ffmpeg loudnorm, and writes
video/audio/manifest.json mapping id -> {file, duration_seconds} using
ffprobe-measured durations.

Run with the isolated TTS venv:
    video/.venv-tts/bin/python video/audio/tts.py [--script PATH] [--voice NAME]
"""

import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

# Literal pause marker in vo_text, e.g. "[PAUSE 1.2s]" -> 1.2s of true silence.
PAUSE_RE = re.compile(r"\[PAUSE\s+(\d+(?:\.\d+)?)\s*s\]", re.IGNORECASE)

AUDIO_DIR = Path(__file__).resolve().parent
VIDEO_DIR = AUDIO_DIR.parent
DEFAULT_SCRIPT = VIDEO_DIR / "script" / "script.json"
DEFAULT_VOICE = "michael"
TARGET_SR = 48000


def ffprobe_duration(path: Path) -> float:
    out = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        check=True, capture_output=True, text=True,
    ).stdout.strip()
    return float(out)


def loudnorm_48k_mono(src: Path, dst: Path) -> None:
    """Resample to 48kHz mono and normalize to -16 LUFS (single-pass loudnorm)."""
    subprocess.run(
        [
            "ffmpeg", "-y", "-v", "error",
            "-i", str(src),
            "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
            "-ar", str(TARGET_SR), "-ac", "1",
            "-c:a", "pcm_s16le",
            str(dst),
        ],
        check=True,
    )


def trim_long_gaps(audio, sample_rate, max_gap=0.7, target_gap=0.45):
    """Shorten dead air *inside* one synthesized segment.

    Pocket TTS occasionally emits a 1s+ stall mid-sentence (stochastic, varies
    per take). Any internal near-silent run longer than max_gap is compressed to
    target_gap. Runs at the very start/end are left alone, and this only ever
    sees a single TTS segment — silence inserted for a [PAUSE Xs] marker is
    added afterwards and is never touched.
    """
    import numpy as np
    import torch

    x = audio.detach().cpu().numpy().astype(np.float32).flatten()
    peak = float(np.abs(x).max())
    if peak <= 0:
        return audio
    hop = max(1, int(sample_rate * 0.01))  # 10 ms frames
    n_frames = len(x) // hop
    if n_frames < 3:
        return audio
    frames = x[: n_frames * hop].reshape(n_frames, hop)
    rms = np.sqrt((frames.astype(np.float64) ** 2).mean(axis=1))
    quiet = rms < (peak * 0.01)  # ~-40 dB relative to peak

    keep = np.ones(len(x), dtype=bool)
    max_frames = int(round(max_gap / 0.01))
    target_frames = int(round(target_gap / 0.01))
    i = 0
    trimmed = 0.0
    while i < n_frames:
        if not quiet[i]:
            i += 1
            continue
        j = i
        while j < n_frames and quiet[j]:
            j += 1
        run = j - i
        internal = i > 0 and j < n_frames  # ignore leading/trailing silence
        if internal and run > max_frames:
            drop = run - target_frames
            start = (i + (run - drop) // 2) * hop  # drop from the middle
            keep[start : start + drop * hop] = False
            trimmed += drop * 0.01
        i = j
    if trimmed <= 0:
        return audio
    print(f"    (trimmed {trimmed:.2f}s of dead air)", flush=True)
    return torch.from_numpy(x[keep])


def synthesize_with_pauses(model, voice_state, text):
    """Synthesize text, honoring [PAUSE Xs] markers as X seconds of true silence.

    The marker is never fed to the TTS: the surrounding text segments are
    synthesized separately and joined with zeros at the model sample rate.
    Returns a 1-D torch tensor.
    """
    import torch

    parts = PAUSE_RE.split(text)  # [text, pause_secs, text, pause_secs, ...]
    chunks = []
    for i, part in enumerate(parts):
        if i % 2 == 1:  # captured pause duration
            n = int(round(float(part) * model.sample_rate))
            ref = chunks[0] if chunks else None
            dtype = ref.dtype if ref is not None else torch.float32
            chunks.append(torch.zeros(n, dtype=dtype))
        else:
            segment = part.strip()
            if segment:
                audio = model.generate_audio(voice_state, segment)
                chunks.append(trim_long_gaps(audio.flatten(), model.sample_rate))
    if not chunks:
        raise ValueError("vo_text produced no audio (empty after pause parsing)")
    return torch.cat(chunks)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--script", type=Path, default=DEFAULT_SCRIPT,
                    help=f"path to script.json (default: {DEFAULT_SCRIPT})")
    ap.add_argument("--voice", default=DEFAULT_VOICE,
                    help=f"Pocket TTS voice name (default: {DEFAULT_VOICE})")
    ap.add_argument("--only", nargs="*", default=None,
                    help="optional list of scene ids to (re)render")
    args = ap.parse_args()

    if not args.script.exists():
        print(f"error: script file not found: {args.script}", file=sys.stderr)
        return 1

    scenes = json.loads(args.script.read_text())
    if isinstance(scenes, dict):  # tolerate {"scenes": [...]} wrapper
        scenes = scenes.get("scenes", [])
    if not isinstance(scenes, list) or not scenes:
        print("error: script.json must be a non-empty array of scenes", file=sys.stderr)
        return 1

    from pocket_tts import TTSModel  # heavy import; keep after arg parsing
    import scipy.io.wavfile

    print(f"loading Pocket TTS model (voice: {args.voice}) ...", flush=True)
    model = TTSModel.load_model()
    voice_state = model.get_state_for_audio_prompt(args.voice)

    manifest_path = AUDIO_DIR / "manifest.json"
    previous = {}
    if manifest_path.exists():
        try:
            loaded = json.loads(manifest_path.read_text())
            if isinstance(loaded, dict):
                previous = {k: v for k, v in loaded.items() if isinstance(v, dict)}
        except json.JSONDecodeError:
            pass

    manifest = {}
    for scene in scenes:
        sid = scene["id"]
        text = scene["vo_text"].strip()
        if args.only and sid not in args.only:
            if sid in previous:  # keep prior render for scenes not re-rendered
                manifest[sid] = previous[sid]
            continue
        out_wav = AUDIO_DIR / f"{sid}.wav"
        print(f"[{sid}] synthesizing {len(text.split())} words ...", flush=True)
        audio = synthesize_with_pauses(model, voice_state, text)
        with tempfile.NamedTemporaryFile(suffix=".wav", dir=AUDIO_DIR, delete=False) as tmp:
            raw_path = Path(tmp.name)
        try:
            scipy.io.wavfile.write(str(raw_path), model.sample_rate, audio.numpy())
            loudnorm_48k_mono(raw_path, out_wav)
        finally:
            raw_path.unlink(missing_ok=True)
        dur = ffprobe_duration(out_wav)
        manifest[sid] = {"file": out_wav.name, "duration_seconds": round(dur, 3)}
        print(f"[{sid}] -> {out_wav.name} ({dur:.2f}s)", flush=True)

    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
    total = sum(v["duration_seconds"] for v in manifest.values())
    print(f"wrote {manifest_path} ({len(manifest)} scenes, {total:.1f}s total VO)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
