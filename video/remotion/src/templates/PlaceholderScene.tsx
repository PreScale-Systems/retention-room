import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import type {ResolvedScene} from '../data';

// Phase-1 placeholder. Phase 2 replaces this with real templates per
// video/DESIGN.md — one file per template in this directory, all taking
// {scene: ResolvedScene} so they plug into Main without rewiring.
export const PlaceholderScene: React.FC<{scene: ResolvedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0b0f14',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 120,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      }}
    >
      <div style={{opacity, maxWidth: 1400, textAlign: 'center'}}>
        <div
          style={{
            color: '#4fc3f7',
            fontSize: 32,
            letterSpacing: 6,
            textTransform: 'uppercase',
            marginBottom: 40,
            fontWeight: 600,
          }}
        >
          {scene.id}
        </div>
        <div
          style={{
            color: '#e8eef4',
            fontSize: 52,
            lineHeight: 1.35,
            fontWeight: 500,
          }}
        >
          {scene.vo_text}
        </div>
        {scene.on_screen ? (
          <div
            style={{
              color: '#8899aa',
              fontSize: 28,
              marginTop: 48,
              fontStyle: 'italic',
            }}
          >
            [{scene.on_screen}]
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
