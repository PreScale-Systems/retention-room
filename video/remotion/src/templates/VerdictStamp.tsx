import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, MONO, STAMP, UI} from '../theme';

export type VerdictStampProps = {
  at: number; // scene frame the sequence starts (impact = at + 6)
  text: string; // STORY PROBLEM | DELIVERY INCIDENT
  color: 'loss' | 'rewatch';
  subLine: string;
  stats?: {value: string; caption: string; tinted?: boolean}[]; // S4 only
};

// Shake offsets, §3.4 step 3 (relative frames 8–11).
const SHAKE: Record<number, [number, number]> = {8: [5, -3], 9: [-3, 2], 10: [1, -1]};

export const stampShake = (t: number): [number, number] => SHAKE[t] ?? [0, 0];

// §3.4 — the one licensed overshoot. Render ON TOP of a settled AppShot/
// SplitReveal. The parent applies plate dim/desaturate via verdictDim().
export const VerdictStamp: React.FC<VerdictStampProps> = ({at, text, color, subLine, stats}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame - at;
  if (t < 0) return null;

  const accent = color === 'loss' ? C.loss : C.rewatch;

  // Impact: spring-driven scale 1.9 → 1.0 with one overshoot below 1.0.
  const s = spring({frame: t - 6, fps, config: STAMP});
  const scale = interpolate(s, [0, 1], [1.9, 1.0]);
  const stampO = interpolate(t, [6, 9], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const [shX, shY] = stampShake(t);

  // Impact ring: expands 1.0→1.22 fading 0.7→0 over f8–f22.
  const ringT = interpolate(t, [8, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ringScale = 1.0 + 0.22 * ringT;
  const ringO = t >= 8 ? 0.7 * (1 - ringT) : 0;

  const subO = interpolate(t, [26, 32], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Micro-drift so the hold never freezes.
  const drift = interpolate(frame, [at, durationInFrames], [1.0, 1.015]);

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* deepened vignette during the verdict hold */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 40%, rgba(0,0,0,${
            0.62 * interpolate(t, [0, 6], [0, 1], {extrapolateRight: 'clamp'})
          }) 100%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '46%',
          transform: `translate(-50%, -50%) translate(${shX}px, ${shY}px)`,
        }}
      >
        {/* impact ring */}
        <div
          style={{
            position: 'absolute',
            inset: -24,
            border: `3px solid ${accent}`,
            borderRadius: 14,
            opacity: ringO,
            transform: `rotate(-4deg) scale(${ringScale})`,
          }}
        />
        <div
          style={{
            transform: `rotate(-4deg) scale(${scale * drift})`,
            opacity: stampO,
            background: accent,
            color: C.stampInk,
            borderRadius: 10,
            padding: '32px 56px',
            fontFamily: UI,
            fontWeight: 800,
            fontSize: 120,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}
        >
          {text}
        </div>
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: 28,
            fontFamily: MONO,
            fontSize: 28,
            color: C.text2,
            whiteSpace: 'nowrap',
            opacity: subO,
          }}
        >
          {subLine}
        </div>
      </div>
      {stats ? (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 108,
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 96,
            // EDITOR P1-10: the 72px stats sat straight on the app's scene-card
            // grid and the underlying sluglines read THROUGH them. Scrim so the
            // judge's number is unmissable.
            background: 'rgba(15,17,20,0.72)',
            border: `1px solid rgba(68,73,79,0.55)`,
            borderRadius: 16,
            padding: '22px 56px',
            backdropFilter: 'blur(6px)',
            opacity: interpolate(t, [30, 38], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {stats.map((stat, i) => {
            const statT = t - (34 + i * 6);
            const o = interpolate(statT, [0, 10], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const y = interpolate(statT, [0, 10], [16, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <div
                key={i}
                style={{
                  textAlign: 'center',
                  opacity: o,
                  transform: `translateY(${y}px)`,
                }}
              >
                <div
                  style={{
                    fontFamily: MONO,
                    fontWeight: 700,
                    fontSize: 72,
                    color: stat.tinted ? accent : C.text,
                  }}
                >
                  {stat.value}
                </div>
                <div style={{fontFamily: UI, fontWeight: 500, fontSize: 28, color: C.text2}}>
                  {stat.caption}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// Helper for parents: plate brightness/saturation during the pre-hush.
export const verdictDim = (
  frame: number,
  at: number,
): {brightness: number; saturate: number; panelOpacity: number} => {
  const t = frame - at;
  const k = interpolate(t, [0, 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return {
    brightness: 1 - 0.55 * k,
    saturate: 1 - 0.4 * k,
    panelOpacity: 1 - 0.7 * k,
  };
};
