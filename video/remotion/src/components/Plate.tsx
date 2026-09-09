import React, {createContext, useContext} from 'react';
import {Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BEZ, C, EASE_SLOW, MONO, PLATE, UI} from '../theme';
import {Callout, CalloutSpec} from './Callout';

// Which PNGs actually exist in public/assets — provided by Main from the
// asset index so missing captures degrade to a styled placeholder.
export const AssetsContext = createContext<string[]>([]);

export type KenBurns = {
  from: {scale: number; x: number; y: number};
  to: {scale: number; x: number; y: number};
};

// --- Framing helper -------------------------------------------------------
// The Ken Burns wrapper applies `scale(s) translate(tx,ty)` about the plate
// centre, so a source-image point sx maps to s*(sx*toPlate - plateW/2 + tx).
// Authoring raw scale/x/y by hand is how the draft-1 shots ended up clipping
// the RETENTION ROOM wordmark, so shots now declare the SOURCE RECTANGLE they
// want on screen and this converts it. Guarantee: the returned params show
// exactly [x, x+w] x [y, y+w*imgH/imgW] of the capture — keep the rect inside
// [0,imgW]x[0,imgH] and nothing can be clipped.
export type SrcRect = {x: number; y: number; w: number};

export const frameRect = (
  r: SrcRect,
  opts: {imgW?: number; imgH?: number; plateW?: number} = {},
): {scale: number; x: number; y: number} => {
  const imgW = opts.imgW ?? 1920;
  const imgH = opts.imgH ?? 1080;
  const toPlate = (opts.plateW ?? PLATE.width) / imgW;
  const h = (r.w * imgH) / imgW;
  return {
    scale: imgW / r.w,
    x: (imgW / 2 - (r.x + r.w / 2)) * toPlate,
    y: (imgH / 2 - (r.y + h / 2)) * toPlate,
  };
};

// Convenience: a Ken Burns move expressed as two source rectangles.
export const frameMove = (
  from: SrcRect,
  to: SrcRect,
  opts?: {imgW?: number; imgH?: number; plateW?: number},
): KenBurns => ({from: frameRect(from, opts), to: frameRect(to, opts)});

export type PlateProps = {
  // Candidate filenames in video/assets, first match wins; if none exist a
  // placeholder frame with the expected filename renders instead.
  src: string | string[];
  kenBurns?: KenBurns;
  // Preferred over kenBurns: declare the SOURCE rectangles to frame and let the
  // Plate convert them against its OWN width. Required whenever `width`
  // animates (ep5-refusal), because the translate half of a Ken Burns is in
  // plate pixels and would otherwise mis-frame as the plate resizes.
  kbRect?: {from: SrcRect; to: SrcRect};
  // EDITOR P0-6: every join dipped to black because plates entered at opacity 0
  // on a black stage. The default join is a straight cut (DESIGN §2); only the
  // very first shot of a chapter may fade.
  entrance?: 'fade' | 'none';
  callouts?: CalloutSpec[];
  width?: number; // default 1688 (§1.4)
  heroHairline?: boolean; // 3px amber top hairline @35% (S1/S8 only)
  enterAt?: number; // frame the plate entrance starts
  brightness?: number; // SplitReveal dims to 0.78; VerdictStamp dims further
  saturate?: number;
  // Extra transform applied by parents (e.g. VerdictStamp shake) — cheap passthrough.
  style?: React.CSSProperties;
  // Source-image pixel size (all current captures are 1920x1080).
  imgW?: number;
  imgH?: number;
  // Crossfade: previous src fading out as this one fades in.
  crossfadeFrom?: string | string[];
  crossfadeAt?: number; // frame the 8f crossfade starts
};

const pick = (candidates: string | string[], available: string[]): {file: string; found: boolean} => {
  const list = Array.isArray(candidates) ? candidates : [candidates];
  for (const c of list) {
    if (available.includes(c)) return {file: c, found: true};
  }
  return {file: list[0], found: false};
};

const Missing: React.FC<{file: string}> = ({file}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background: C.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
    }}
  >
    <div
      style={{
        border: `2px dashed ${C.line2}`,
        borderRadius: 12,
        padding: '28px 48px',
        fontFamily: MONO,
        fontSize: 30,
        color: C.text2,
      }}
    >
      {file}
    </div>
    <div style={{fontFamily: UI, fontSize: 26, fontWeight: 500, color: C.text3}}>
      awaiting capture — video/assets/
    </div>
  </div>
);

export const Plate: React.FC<PlateProps> = ({
  src,
  kenBurns,
  kbRect,
  entrance = 'none',
  callouts = [],
  width = PLATE.width,
  heroHairline = false,
  enterAt = 0,
  brightness = 1,
  saturate = 1,
  style,
  imgW = 1920,
  imgH = 1080,
  crossfadeFrom,
  crossfadeAt,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const available = useContext(AssetsContext);

  const {file, found} = pick(src, available);
  const prev = crossfadeFrom ? pick(crossfadeFrom, available) : null;

  const height = Math.round((width * imgH) / imgW);

  // Entrance: opacity 0→1 + scale 0.965→1, 12 frames, EASE_SLOW (§3.2).
  // Opt-in only — see the `entrance` prop.
  const enter = spring({frame: frame - enterAt, fps, config: EASE_SLOW, durationInFrames: 14});
  const enterOpacity =
    entrance === 'fade'
      ? interpolate(frame - enterAt, [0, 12], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 1;
  const enterScale = entrance === 'fade' ? 0.965 + 0.035 * enter : 1;

  // Ken Burns: single continuous LINEAR drift across the scene (§2).
  const kb =
    (kbRect ? frameMove(kbRect.from, kbRect.to, {imgW, imgH, plateW: width}) : kenBurns) ??
    {from: {scale: 1, x: 0, y: 0}, to: {scale: 1, x: 0, y: 0}};
  const kScale = interpolate(frame, [0, durationInFrames], [kb.from.scale, kb.to.scale]);
  const kX = interpolate(frame, [0, durationInFrames], [kb.from.x, kb.to.x]);
  const kY = interpolate(frame, [0, durationInFrames], [kb.from.y, kb.to.y]);

  const toPlate = width / imgW; // source px → plate px

  const xfade =
    prev && crossfadeAt !== undefined
      ? interpolate(frame, [crossfadeAt, crossfadeAt + 8], [0, 1], {
          easing: Easing.bezier(...BEZ),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 1;

  const imgEl = (f: string, ok: boolean, opacity: number) =>
    ok ? (
      <Img
        src={staticFile(`assets/${f}`)}
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity}}
      />
    ) : (
      <div style={{position: 'absolute', inset: 0, opacity}}>
        <Missing file={f} />
      </div>
    );

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width,
        height,
        transform: `translate(-50%, -50%) scale(${enterScale})`,
        opacity: enterOpacity,
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: PLATE.radius,
          border: PLATE.border,
          boxShadow: PLATE.shadow,
          overflow: 'hidden',
          background: C.bg,
          filter: `brightness(${brightness}) saturate(${saturate})`,
        }}
      >
        {/* Ken Burns wrapper — callouts live inside so they track pixels. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `scale(${kScale}) translate(${kX}px, ${kY}px)`,
          }}
        >
          {prev ? imgEl(prev.file, prev.found, 1 - xfade) : null}
          {prev ? imgEl(file, found, xfade) : imgEl(file, found, 1)}
          {/* Callout layer in source-image pixel space, scaled to plate px. */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: imgW,
              height: imgH,
              transform: `scale(${toPlate})`,
              transformOrigin: 'top left',
            }}
          >
            {callouts.map((c) => (
              <Callout key={`${c.label}-${c.frame}`} {...c} />
            ))}
          </div>
        </div>
        {heroHairline ? (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: C.amber,
              opacity: 0.35,
            }}
          />
        ) : null}
      </div>
    </div>
  );
};
