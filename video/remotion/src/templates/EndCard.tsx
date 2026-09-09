import React, {useContext} from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, EASE, MONO, UI} from '../theme';
import {Stage} from '../components/Stage';
import {AssetsContext} from '../components/Plate';

const WORDMARK = 'RETENTION ROOM';

// Approximation of the real ep4 retention curve (92% → slow bleed → scene-13
// slide → credits cliff), drawn as the §3.5 ambient line at 8% opacity.
const CURVE_PATH =
  'M 0 90 L 120 95 L 320 175 L 620 205 L 980 235 L 1180 260 L 1420 380 L 1600 440 L 1820 470 L 1880 700 L 1920 710';

export type EndCardProps = {
  chartCrop?: string | string[]; // ep4 flagged chart for the mini plate
};

// §3.5
export const EndCard: React.FC<EndCardProps> = ({chartCrop = []}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const available = useContext(AssetsContext);

  const candidates = Array.isArray(chartCrop) ? chartCrop : [chartCrop];
  const crop = candidates.find((c) => available.includes(c));

  const tagS = spring({frame: frame - 10, fps, config: EASE, durationInFrames: 10});
  const tagO = interpolate(frame, [10, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const plateO = interpolate(frame, [16, 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const urlO = interpolate(frame, [24, 34], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // final 15 frames fade everything to stage
  const outO = interpolate(frame, [durationInFrames - 15, durationInFrames - 2], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Ambient curve trace across the whole scene. P2-6: the dasharray was 2600
  // against a ~2360px path, so the stroke finished ~10% early and read as a
  // broken line; it now runs to the last frame.
  const traceLen = 2360;
  const trace = interpolate(frame, [0, durationInFrames - 8], [traceLen, 0], {
    extrapolateRight: 'clamp',
  });

  // P0-5: the EndCard was 4.9s of zero-motion frame. Slow linear drift.
  const drift = interpolate(frame, [0, durationInFrames], [1, 1.015]);

  return (
    <Stage>
      <svg
        width={1920}
        height={1080}
        style={{position: 'absolute', inset: 0, opacity: 0.08}}
        viewBox="0 0 1920 1080"
      >
        <path
          d={CURVE_PATH}
          transform="translate(0, 140)"
          stroke={C.amber}
          strokeWidth={2}
          fill="none"
          strokeDasharray={traceLen}
          strokeDashoffset={trace}
        />
      </svg>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: outO}}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transform: `scale(${drift})`,
          }}
        >
          <div
            style={{
              fontFamily: UI,
              fontWeight: 800,
              fontSize: 84,
              letterSpacing: '0.01em',
              color: C.text,
              whiteSpace: 'pre',
            }}
          >
            {WORDMARK.split('').map((ch, i) => {
              // 1 frame per letter opacity stagger over frames 0–14 — restraint.
              const o = interpolate(frame, [i, i + 3], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              // the two O's of "ROOM" in amber (indices 11 and 12)
              const amberO = i === 11 || i === 12;
              return (
                <span key={i} style={{opacity: o, color: amberO ? C.amber : C.text}}>
                  {ch}
                </span>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 8,
              fontFamily: UI,
              fontWeight: 500,
              fontSize: 36,
              color: C.text2,
              opacity: tagO,
              transform: `translateY(${16 * (1 - tagS)}px)`,
            }}
          >
            Which scene lost them.
          </div>
          <div
            style={{
              marginTop: 40,
              width: 900,
              height: 220,
              borderRadius: 14,
              border: `1px solid rgba(68,73,79,0.6)`,
              boxShadow: '0 32px 90px rgba(0,0,0,0.6), 0 4px 18px rgba(0,0,0,0.4)',
              overflow: 'hidden',
              background: C.bg,
              opacity: plateO,
              position: 'relative',
            }}
          >
            {crop ? (
              <Img
                src={staticFile(`assets/${crop}`)}
                // EDITOR P1-12: the old crop was ~40% a slab of analyst prose
                // clipped mid-word. Frame source x≈60–1440 / y≈170–507 so the
                // red flagged scene-13 band IS the image (DESIGN §3.5).
                // 900px plate / 1380px source ⇒ display the 1920px capture at
                // 1252px and offset by the source origin × that ratio.
                style={{
                  position: 'absolute',
                  width: 1252,
                  left: -39,
                  top: -120,
                }}
              />
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: MONO,
                  fontSize: 24,
                  color: C.text3,
                }}
              >
                ep4 chart · scene 13 flagged
              </div>
            )}
          </div>
          <div
            style={{
              marginTop: 32,
              fontFamily: MONO,
              fontWeight: 500,
              fontSize: 30,
              color: C.text2,
              opacity: urlO,
            }}
          >
            retention-room-769027363263.us-central1.run.app
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 64,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: MONO,
            fontSize: 24,
            color: C.text3,
            opacity: urlO,
          }}
        >
          ClickHouse Cloud · mcp-clickhouse · Google ADK · Gemini
        </div>
      </AbsoluteFill>
    </Stage>
  );
};
