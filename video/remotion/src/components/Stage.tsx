import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../theme';

// §1.1: stage background + vignette (center 50%/42%, corners rgba(0,0,0,0.45)).
export const Stage: React.FC<{
  children?: React.ReactNode;
  vignetteAlpha?: number; // VerdictStamp deepens this to 0.62
}> = ({children, vignetteAlpha = 0.45}) => {
  return (
    <AbsoluteFill style={{backgroundColor: C.stage}}>
      {children}
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background: `radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 45%, rgba(0,0,0,${vignetteAlpha}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
