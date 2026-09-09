import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, MONO} from '../theme';

const KEYWORDS =
  /\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|LIMIT|WITH|AS|AND|OR|JOIN|ON|BETWEEN|IN|OVER|CREATE|MATERIALIZED|VIEW|IF|NOT|EXISTS|TO|DESC|ASC|sum|count|lag|intDiv|import|from|return|def)\b/g;

// Light single-pass tinting: keywords amber, 'strings' rewatch, -- / # comments text3.
const tint = (line: string): React.ReactNode => {
  if (/^\s*(--|#)/.test(line)) {
    return <span style={{color: C.text3}}>{line}</span>;
  }
  const parts: React.ReactNode[] = [];
  // split out string literals first
  const segs = line.split(/('[^']*'|"[^"]*")/g);
  segs.forEach((seg, i) => {
    if (/^['"].*['"]$/.test(seg)) {
      parts.push(
        <span key={i} style={{color: C.rewatch}}>
          {seg}
        </span>,
      );
      return;
    }
    let last = 0;
    const nodes: React.ReactNode[] = [];
    for (const m of seg.matchAll(KEYWORDS)) {
      nodes.push(seg.slice(last, m.index));
      nodes.push(
        <span key={`${i}-${m.index}`} style={{color: C.amber}}>
          {m[0]}
        </span>,
      );
      last = (m.index ?? 0) + m[0].length;
    }
    nodes.push(seg.slice(last));
    parts.push(<React.Fragment key={i}>{nodes}</React.Fragment>);
  });
  return parts;
};

const LINE_H = 26 * 1.55; // §1.2 code spec
// EDITOR P1-5: at 14 the two 17-line repo excerpts scrolled, which sliced the
// top visible line through its x-height and pushed the `mv_exits_by_second`
// highlight off-screen before it ever fired. 17 fits both excerpts whole
// (56 header + 48 padding + 17*40.3 = 789px, inside the 820px panel cap).
const MAX_VISIBLE = 17; // §2 scroll cap

export type CodePanelProps = {
  header: string; // left side of the 56px header bar
  lines: string[];
  revealAt?: number; // frame line 0 starts revealing
  rows?: string[][]; // optional result rows after the SQL completes
  rowsHeader?: string[];
  rowsAt?: number; // frame rows start revealing (default: after last line + 8)
  rowsColor?: 'text2' | 'rewatch'; // ep5 tints its rows blue
  highlightLines?: number[]; // amberDim full-width wash (under-the-hood)
  highlightAt?: number;
  highlightRowChip?: string; // chip next to result row 0 (ep5)
  width?: number;
  opacity?: number; // VerdictStamp drops open panels to 30%
  // EDITOR P0-5: `freezedetect` found 14.3s of zero-motion frames on the two
  // under-the-hood code beats. DESIGN §2 requires a continuous linear drift on
  // every shot; this adds it (scale 1→1.02 + a slow 18px body lift).
  drift?: boolean;
};

// §3.3 body + §2 SQL reveal: per-line opacity 0→1 / translateY 8→0 over 6f,
// 3f stagger; amber caret at the newest line; oldest lines scroll up past 14.
export const CodePanel: React.FC<CodePanelProps> = ({
  header,
  lines,
  revealAt = 0,
  rows,
  rowsHeader,
  rowsAt,
  rowsColor = 'text2',
  highlightLines = [],
  highlightAt = 0,
  highlightRowChip,
  width = 760,
  opacity = 1,
  drift = false,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  // §2 ambient drift — linear, across the whole beat.
  const driftT = drift
    ? interpolate(frame, [0, durationInFrames], [0, 1], {extrapolateRight: 'clamp'})
    : 0;

  const lineStart = (i: number) => revealAt + i * 3;
  const lastLineDone = lineStart(lines.length - 1) + 6;
  const caretGone = lastLineDone + 6;

  // newest landed line index
  const newest = Math.min(
    lines.length - 1,
    Math.max(0, Math.floor((frame - revealAt) / 3)),
  );
  // scroll: keep newest within the 14-line window
  const scrollLines = Math.max(0, newest - (MAX_VISIBLE - 1));
  const scrollY = -scrollLines * LINE_H;

  const rowsStart = rowsAt ?? lastLineDone + 8;

  return (
    <div
      style={{
        width,
        maxHeight: 820,
        background: 'rgba(34,37,42,0.97)',
        borderRadius: 12,
        border: `1px solid ${C.line2}`,
        boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
        overflow: 'hidden',
        opacity,
        transform: `scale(${1 + 0.02 * driftT})`,
      }}
    >
      <div
        style={{
          height: 56,
          background: C.bg,
          borderBottom: `1px solid ${C.line}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          fontFamily: MONO,
          fontSize: 24,
          color: C.text2,
        }}
      >
        <span>{header}</span>
        <span style={{width: 10, height: 10, borderRadius: 5, background: C.amber}} />
      </div>
      <div style={{padding: 24}}>
        {/* Only the CODE LINES are clipped. The result rows used to live inside
            this clip too, which is why ep5's `highlightRowChip` (P1-4) — the row
            that proves the refusal — was silently cut off the bottom. */}
        <div style={{overflow: 'hidden', maxHeight: MAX_VISIBLE * LINE_H + 8}}>
        <div style={{transform: `translateY(${scrollY - 18 * driftT}px)`}}>
          {lines.map((line, i) => {
            const t = frame - lineStart(i);
            const o = interpolate(t, [0, 6], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const y = interpolate(t, [0, 6], [8, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const hl = highlightLines.includes(i);
            const hlO = hl
              ? interpolate(frame - highlightAt, [0, 8], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                })
              : 0;
            const showCaret =
              frame < caretGone && i === newest && frame >= revealAt;
            const caretOn = Math.floor(frame / 7.5) % 2 === 0; // 15f period
            return (
              <div
                key={i}
                style={{
                  fontFamily: MONO,
                  fontSize: 26,
                  lineHeight: 1.55,
                  color: C.text,
                  whiteSpace: 'pre',
                  opacity: o,
                  transform: `translateY(${y}px)`,
                  background: hl ? `rgba(245,184,61,${0.16 * hlO})` : undefined,
                  margin: hl ? '0 -24px' : undefined,
                  padding: hl ? '0 24px' : undefined,
                }}
              >
                {tint(line)}
                {showCaret ? (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 26,
                      height: 4,
                      marginLeft: 4,
                      background: C.amber,
                      opacity: caretOn ? 1 : 0,
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
        </div>
        {rows && frame >= rowsStart ? (
          <div style={{marginTop: 16}}>
            <div style={{borderTop: `1px dashed ${C.line}`, marginBottom: 12}} />
            {rowsHeader ? (
              <div
                style={{
                  display: 'flex',
                  gap: 24,
                  fontFamily: MONO,
                  fontSize: 24,
                  color: C.text3,
                  marginBottom: 6,
                }}
              >
                {rowsHeader.map((h, i) => (
                  <span key={i} style={{flex: i === 1 ? 2 : 1}}>
                    {h}
                  </span>
                ))}
              </div>
            ) : null}
            {rows.map((row, ri) => {
              const o = interpolate(frame - (rowsStart + ri * 4), [0, 6], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              // rowsColor 'rewatch': the top (marquee) row carries the accent.
              const rowTint = ri === 0 && rowsColor === 'rewatch' ? C.rewatch : C.text2;
              return (
                <div
                  key={ri}
                  style={{
                    display: 'flex',
                    gap: 24,
                    alignItems: 'center',
                    fontFamily: MONO,
                    fontSize: 24,
                    lineHeight: 1.6,
                    color: rowTint,
                    opacity: o,
                  }}
                >
                  {row.map((cell, ci) => (
                    <span
                      key={ci}
                      style={{
                        flex: ci === 1 ? 2 : 1,
                        color: ci === 0 ? (ri === 0 && rowsColor === 'rewatch' ? C.rewatch : C.text) : undefined,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cell}
                    </span>
                  ))}
                </div>
              );
            })}
            {highlightRowChip ? (
              <div
                style={{
                  marginTop: 14,
                  opacity: interpolate(frame - (rowsStart + rows.length * 4 + 6), [0, 8], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  }),
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    background: C.panel2,
                    border: `1px solid ${C.rewatch}`,
                    borderRadius: 999,
                    padding: '8px 20px',
                    fontFamily: MONO,
                    fontSize: 24,
                    color: C.rewatch,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {highlightRowChip}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};
