import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Stage} from '../components/Stage';
import {Plate, PlateProps} from '../components/Plate';
import {LowerThird} from '../components/LowerThird';

export type AppShotProps = PlateProps & {
  lowerThird?: string;
  vignetteAlpha?: number;
  children?: React.ReactNode; // overlays (VerdictStamp composes on top)
};

// §3.2 — the workhorse: real screenshot + Ken Burns + tracked callouts.
export const AppShot: React.FC<AppShotProps> = ({
  lowerThird,
  vignetteAlpha,
  children,
  ...plate
}) => {
  return (
    <Stage vignetteAlpha={vignetteAlpha}>
      <AbsoluteFill>
        <Plate {...plate} />
        {lowerThird ? <LowerThird text={lowerThird} /> : null}
        {children}
      </AbsoluteFill>
    </Stage>
  );
};
