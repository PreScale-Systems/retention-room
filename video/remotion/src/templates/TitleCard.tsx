import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, EASE, MONO, UI} from '../theme';
import {Stage} from '../components/Stage';

export type TitleCardProps = {
  kicker: string;
  headline: string;
  sub?: string;
};

// §3.1 — cold open + interstitials.
export const TitleCard: React.FC<TitleCardProps> = ({kicker, headline, sub}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  // P2-2: frame 0 was literally black while the VO was already talking.
  const kickerO = interpolate(frame, [0, 8], [0.35, 1], {extrapolateRight: 'clamp'});
  const ruleS = spring({frame: frame - 4, fps, config: EASE, durationInFrames: 10});
  const headS = spring({frame: frame - 6, fps, config: EASE, durationInFrames: 10});
  const headO = interpolate(frame, [6, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const subS = spring({frame: frame - 12, fps, config: EASE, durationInFrames: 10});
  const subO = interpolate(frame, [12, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ambient = interpolate(frame, [0, durationInFrames], [1.0, 1.025]);

  return (
    <Stage>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div
          style={{
            maxWidth: 1400,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 24,
            transform: `scale(${ambient})`,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontWeight: 500,
              fontSize: 24,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: C.amber,
              opacity: kickerO,
            }}
          >
            {kicker}
          </div>
          <div
            style={{
              width: 160,
              height: 2,
              background: C.amber,
              transform: `scaleX(${ruleS})`,
            }}
          />
          <div
            style={{
              fontFamily: UI,
              fontWeight: 800,
              fontSize: 96,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              color: C.text,
              opacity: headO,
              transform: `translateY(${28 * (1 - headS)}px)`,
            }}
          >
            {headline}
          </div>
          {sub ? (
            <div
              style={{
                fontFamily: UI,
                fontWeight: 500,
                fontSize: 34,
                lineHeight: 1.4,
                color: C.text2,
                opacity: subO,
                transform: `translateY(${20 * (1 - subS)}px)`,
              }}
            >
              {sub}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    </Stage>
  );
};
