import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {BEZ, C, SAFE_X, SAFE_Y, UI} from '../theme';

// §3.2: lower-third caption pill, bottom-left inside safe margins.
export const LowerThird: React.FC<{text: string; enterAt?: number}> = ({text, enterAt = 8}) => {
  const frame = useCurrentFrame();
  const t = frame - enterAt;
  const x = interpolate(t, [0, 10], [-24, 0], {
    easing: Easing.bezier(...BEZ),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(t, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: SAFE_X,
        bottom: SAFE_Y,
        transform: `translateX(${x}px)`,
        opacity,
        background: 'rgba(34,37,42,0.92)', // panel @92%
        border: `1px solid ${C.line}`,
        borderRadius: 999,
        padding: '16px 28px',
        fontFamily: UI,
        fontWeight: 600,
        fontSize: 32,
        color: C.text,
      }}
    >
      {text}
    </div>
  );
};
