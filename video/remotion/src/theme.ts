// Design tokens — single source of truth, per video/DESIGN.md §1 + §2.
// Templates import ONLY from this file for colors/type/springs.
import {loadFont as loadManrope} from '@remotion/google-fonts/Manrope';
import {loadFont as loadJetBrainsMono} from '@remotion/google-fonts/JetBrainsMono';

const manrope = loadManrope('normal', {weights: ['500', '600', '700', '800']});
const jbMono = loadJetBrainsMono('normal', {weights: ['400', '500', '700']});

export const fontsReady = Promise.all([manrope.waitUntilDone(), jbMono.waitUntilDone()]);

export const UI = `${manrope.fontFamily}, system-ui, sans-serif`;
export const MONO = `${jbMono.fontFamily}, ui-monospace, monospace`;

// §1.1 palette
export const C = {
  stage: '#0F1114',
  bg: '#1B1D21',
  panel: '#22252A',
  panel2: '#2A2E34',
  line: '#363A41',
  line2: '#44494F',
  text: '#E8E6E1',
  text2: '#A7A9AE',
  text3: '#6F7278',
  amber: '#F5B83D',
  amberDim: 'rgba(245,184,61,0.16)',
  loss: '#E5654B',
  lossDim: 'rgba(229,101,75,0.18)',
  rewatch: '#5FB3F0',
  rewatchDim: 'rgba(95,179,240,0.18)',
  stampInk: '#101216',
} as const;

export type AccentName = 'amber' | 'loss' | 'rewatch';
export const accentDim = (a: AccentName): string =>
  a === 'amber' ? C.amberDim : a === 'loss' ? C.lossDim : C.rewatchDim;

// §2 named springs
export const EASE = {damping: 200};
export const EASE_SLOW = {damping: 200, stiffness: 60};
export const STAMP = {damping: 11, stiffness: 190, mass: 0.9};

// ease-out-quint feel, for non-spring interpolations
export const BEZ: [number, number, number, number] = [0.22, 1, 0.36, 1];

// §1.4 plate
export const PLATE = {
  radius: 14,
  border: `1px solid rgba(68,73,79,0.6)`, // line2 @ 60%
  shadow: '0 32px 90px rgba(0,0,0,0.6), 0 4px 18px rgba(0,0,0,0.4)',
  width: 1688,
} as const;

// §5 safe margins
export const SAFE_X = 96;
export const SAFE_Y = 64;
