import React from 'react';
import {Composition} from 'remotion';
import {Main, MainProps} from './Main';
import {FPS, HEIGHT, WIDTH, loadMainData, totalDurationInFrames} from './data';
import {fontsReady} from './theme';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Main"
      component={Main}
      width={WIDTH}
      height={HEIGHT}
      fps={FPS}
      // Fallback duration; calculateMetadata overrides with the real total
      // derived from video/audio/manifest.json measured durations.
      durationInFrames={30 * FPS}
      defaultProps={{scenes: [], assets: []} satisfies MainProps}
      calculateMetadata={async () => {
        const [data] = await Promise.all([loadMainData(), fontsReady]);
        return {
          durationInFrames: totalDurationInFrames(data.scenes),
          props: data,
        };
      }}
    />
  );
};
