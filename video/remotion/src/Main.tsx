import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {MainData, ResolvedScene} from './data';
import {PUSH} from './data';
import {BEZ, C} from './theme';
import {AssetsContext} from './components/Plate';
import {AUDIO_DELAY, FallbackScene, SCENES} from './scenes';

export type MainProps = MainData;

// §2 chapter push: outgoing slides -60px/fades over its last 10 frames while
// the incoming (offset -10 on the timeline) slides from +60px.
const PushWrap: React.FC<{scene: ResolvedScene; children: React.ReactNode}> = ({
  scene,
  children,
}) => {
  const frame = useCurrentFrame();
  let x = 0;
  let opacity = 1;
  if (scene.pushIn) {
    const t = interpolate(frame, [0, PUSH], [0, 1], {
      easing: Easing.bezier(...BEZ),
      extrapolateRight: 'clamp',
    });
    x = 60 * (1 - t);
    opacity = t;
  }
  if (scene.pushOut) {
    const t = interpolate(
      frame,
      [scene.durationInFrames - PUSH, scene.durationInFrames],
      [0, 1],
      {extrapolateLeft: 'clamp', easing: Easing.bezier(...BEZ)},
    );
    x = -60 * t;
    opacity = Math.min(opacity, 1 - t);
  }
  return (
    <AbsoluteFill style={{transform: `translateX(${x}px)`, opacity}}>{children}</AbsoluteFill>
  );
};

export const Main: React.FC<MainProps> = ({scenes, assets}) => {
  const {durationInFrames} = useVideoConfig();
  // EDITOR P2-1: nothing sat under the VO, so the long true silences (and the
  // judge-protected 1.3s beat before "That's the difference between a dashboard
  // and an analyst") read as dropouts rather than beats. A synthesised −30 dB
  // room-tone pad, ~10 dB under the VO, at volume 0.6 ⇒ ~−35 dB in the mix.
  const bedVolume = (f: number) =>
    0.6 *
    interpolate(f, [0, 45, durationInFrames - 40, durationInFrames - 4], [0, 1, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  return (
    <AssetsContext.Provider value={assets ?? []}>
      <AbsoluteFill style={{backgroundColor: C.stage}}>
        <Audio src={staticFile('audio/bed.wav')} volume={bedVolume} />
        {scenes.map((scene) => {
          const SceneComp = SCENES[scene.id] ?? FallbackScene;
          const audioDelay = AUDIO_DELAY[scene.id] ?? 0;
          return (
            <Sequence
              key={scene.id}
              from={scene.startFrame}
              durationInFrames={scene.durationInFrames}
              name={scene.id}
            >
              <PushWrap scene={scene}>
                <SceneComp scene={scene} />
              </PushWrap>
              {scene.audioSrc ? (
                <Sequence from={audioDelay} name={`${scene.id}-audio`}>
                  <Audio src={scene.audioSrc} />
                </Sequence>
              ) : null}
            </Sequence>
          );
        })}
      </AbsoluteFill>
    </AssetsContext.Provider>
  );
};
