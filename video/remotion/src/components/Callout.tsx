import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BEZ, C, EASE, MONO, accentDim, AccentName} from '../theme';

export type CalloutSpec = {
  frame: number; // when the draw-on starts (scene-relative)
  until?: number; // when the 8-frame fade-out starts (default: never)
  region: {x: number; y: number; w: number; h: number}; // source-image px
  label: string;
  color?: AccentName;
  // Which side of the halo the label chip hangs off.
  side?: 'top' | 'bottom' | 'left' | 'right';
};

const ACCENT = {amber: C.amber, loss: C.loss, rewatch: C.rewatch} as const;

// §2 callout: halo rect draw-on (18f) → connector grow (8f, starts f12) →
// label chip pop (8f). Rendered INSIDE the Ken Burns transform so it tracks pixels.
export const Callout: React.FC<CalloutSpec> = ({
  frame: startFrame,
  until,
  region,
  label,
  color = 'amber',
  side = 'bottom',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame - startFrame;
  if (t < 0) return null;

  const accent = ACCENT[color];
  const dim = accentDim(color);

  const fadeOut =
    until !== undefined
      ? interpolate(frame, [until, until + 8], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 1;
  if (fadeOut <= 0) return null;

  const perimeter = 2 * (region.w + region.h);
  const dash = interpolate(t, [0, 18], [perimeter, 0], {
    easing: Easing.bezier(...BEZ),
    extrapolateRight: 'clamp',
  });
  const fill = interpolate(t, [0, 18], [0, 1], {extrapolateRight: 'clamp'});

  const connT = interpolate(t, [12, 20], [0, 1], {
    easing: Easing.bezier(...BEZ),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const chipS = spring({frame: t - 20, fps, config: EASE, durationInFrames: 8});
  const chipOpacity = t < 20 ? 0 : chipS;
  const chipScale = 0.92 + 0.08 * chipS;

  const CONN = 46; // connector length px
  const vertical = side === 'top' || side === 'bottom';
  const connStyle: React.CSSProperties = vertical
    ? {
        left: region.x + region.w / 2 - 1,
        top: side === 'bottom' ? region.y + region.h : region.y - CONN,
        width: 2,
        height: CONN,
        transform: `scaleY(${connT})`,
        transformOrigin: side === 'bottom' ? 'top' : 'bottom',
      }
    : {
        top: region.y + region.h / 2 - 1,
        left: side === 'right' ? region.x + region.w : region.x - CONN,
        height: 2,
        width: CONN,
        transform: `scaleX(${connT})`,
        transformOrigin: side === 'right' ? 'left' : 'right',
      };

  const chipPos: React.CSSProperties =
    side === 'bottom'
      ? {top: region.y + region.h + CONN + 6, left: region.x + region.w / 2, transform: `translateX(-50%) scale(${chipScale})`}
      : side === 'top'
        ? {top: region.y - CONN - 6, left: region.x + region.w / 2, transform: `translate(-50%, -100%) scale(${chipScale})`}
        : side === 'right'
          ? {top: region.y + region.h / 2, left: region.x + region.w + CONN + 6, transform: `translateY(-50%) scale(${chipScale})`}
          : {top: region.y + region.h / 2, left: region.x - CONN - 6, transform: `translate(-100%, -50%) scale(${chipScale})`};

  return (
    <div style={{position: 'absolute', inset: 0, opacity: fadeOut, pointerEvents: 'none'}}>
      <svg
        style={{position: 'absolute', left: region.x - 3, top: region.y - 3}}
        width={region.w + 6}
        height={region.h + 6}
      >
        <rect
          x={3}
          y={3}
          width={region.w}
          height={region.h}
          rx={10}
          fill={dim}
          fillOpacity={fill}
          stroke={accent}
          strokeWidth={3}
          strokeDasharray={perimeter}
          strokeDashoffset={dash}
        />
      </svg>
      <div style={{position: 'absolute', background: accent, ...connStyle}} />
      <div
        style={{
          position: 'absolute',
          ...chipPos,
          opacity: chipOpacity,
          background: C.panel,
          border: `1px solid ${accent}`,
          borderRadius: 999,
          padding: '12px 20px',
          fontFamily: MONO,
          fontSize: 26,
          fontWeight: 500,
          lineHeight: 1.35,
          color: C.text,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    </div>
  );
};
