import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {BEZ} from '../theme';
import {Stage} from '../components/Stage';
import {Plate, PlateProps} from '../components/Plate';
import {LowerThird} from '../components/LowerThird';
import {CodePanel, CodePanelProps} from '../components/CodePanel';
import {QueryBeat} from '../realdata';

export type PanelBeat = {
  at: number; // frame this query lands in the panel (≥70f per beat, §3.3)
  beat: QueryBeat;
  rowsColor?: 'text2' | 'rewatch';
  highlightRowChip?: string;
  showRows?: boolean;
  rowsAt?: number; // scene frame the rows land (default: right after the SQL)
};

export type SplitRevealProps = {
  // Plate is optional: under-the-hood renders pure code panels (real repo
  // files) with no screenshot, per the shot map.
  plate?: PlateProps;
  panelAt?: number; // default 20 (§3.3)
  beats?: PanelBeat[]; // cycling run_query beats
  code?: Omit<CodePanelProps, 'opacity'>; // OR one static code panel (S7)
  panelWidth?: number;
  panelCenter?: boolean; // center the panel when there is no plate
  plateCenterFrac?: number; // plate center as fraction of frame width (§3.3: 0.38)
  lowerThird?: string;
  children?: React.ReactNode; // VerdictStamp overlay
  panelOpacity?: number; // VerdictStamp dims the panel to 0.3
  plateBrightnessOverride?: number;
  // EDITOR P0-4: ep5-refusal opened on 6.5s of near-black because the plate was
  // pinned at the small 1080px/0.31 split layout from frame 0. The plate now
  // STARTS at these values (full-bleed) and animates to the split layout over
  // the 12 frames of the panel entrance. Default = no animation.
  plateWidthFrom?: number;
  plateCenterFracFrom?: number;
};

// §3.3 — screenshot + SQL/code panel with line-by-line reveal.
export const SplitReveal: React.FC<SplitRevealProps> = ({
  plate,
  panelAt = 20,
  beats = [],
  code,
  panelWidth = 760,
  panelCenter = false,
  plateCenterFrac = 0.38,
  lowerThird,
  children,
  panelOpacity = 1,
  plateBrightnessOverride,
  plateWidthFrom,
  plateCenterFracFrom,
}) => {
  const frame = useCurrentFrame();

  // A static code panel (under-the-hood) is the whole shot — it must be up from
  // frame 0 at full opacity (P0-6: the slide-in fade was 0.6–0.75s of pure
  // black at each of those cuts). Query beats keep the §3.3 slide.
  const instant = Boolean(code);

  // Panel entrance: +80px → 0 + fade over 12 frames.
  const panelX = instant
    ? 0
    : interpolate(frame - panelAt, [0, 12], [80, 0], {
        easing: Easing.bezier(...BEZ),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
  const panelO = instant
    ? 1
    : interpolate(frame - panelAt, [0, 12], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

  // Plate split-layout transition (P0-4), on the same 12 frames.
  const split = interpolate(frame - panelAt, [0, 12], [0, 1], {
    easing: Easing.bezier(...BEZ),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const plateWTarget = plate?.width ?? 1250;
  const plateW = plateWidthFrom ? plateWidthFrom + (plateWTarget - plateWidthFrom) * split : plateWTarget;
  const centerFrac =
    plateCenterFracFrom !== undefined
      ? plateCenterFracFrom + (plateCenterFrac - plateCenterFracFrom) * split
      : plateCenterFrac;
  // Screenshot dims to 78% as the panel arrives.
  const dim = interpolate(frame - panelAt, [0, 12], [1, 0.78], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Active beat: swap SQL bodies as the agent works (§3.3 multiple queries).
  const active = beats.filter((b) => frame >= b.at).pop();
  const swapT = active ? frame - active.at : 0;
  const swapO = interpolate(swapT, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const panelStyle: React.CSSProperties = panelCenter
    ? {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) translateX(${panelX}px)`,
        opacity: panelO * panelOpacity,
      }
    : {
        position: 'absolute',
        right: 1920 - 1824, // right edge at x=1824 (§3.3)
        top: '50%',
        transform: `translateY(-50%) translateX(${panelX}px)`,
        opacity: panelO * panelOpacity,
      };

  return (
    <Stage>
      <AbsoluteFill>
        {plate ? (
          <div style={{position: 'absolute', inset: 0}}>
            {/* Plate anchored left, center at 38% of frame width. */}
            <div style={{position: 'absolute', inset: 0, left: 2 * (centerFrac * 1920 - 960)}}>
              <Plate
                {...plate}
                width={plateW}
                brightness={plateBrightnessOverride ?? dim * (plate.brightness ?? 1)}
              />
            </div>
          </div>
        ) : null}
        <div style={panelStyle}>
          {code ? (
            <CodePanel {...code} width={panelWidth} drift />
          ) : active ? (
            <div style={{opacity: swapO}}>
              <CodePanel
                key={active.at}
                header={`run_query · mcp-clickhouse · ${active.beat.title}`}
                lines={active.beat.sql}
                revealAt={active.at + 6}
                rows={active.showRows ? active.beat.rows : undefined}
                rowsHeader={active.showRows ? active.beat.rowsHeader : undefined}
                rowsAt={active.rowsAt}
                rowsColor={active.rowsColor}
                highlightRowChip={active.highlightRowChip}
                width={panelWidth}
              />
            </div>
          ) : null}
        </div>
        {lowerThird ? <LowerThird text={lowerThird} /> : null}
        {children}
      </AbsoluteFill>
    </Stage>
  );
};
