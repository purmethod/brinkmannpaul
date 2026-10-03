/**
 * The Cyclemax crest. Must stay identical to assets/logo.svg (checked by a unit test),
 * which is the source for every generated icon and splash image.
 */
export const LOGO_VIEWBOX = '0 0 140 140';
export const LOGO_TRANSFORM = 'translate(70,67) scale(1.1) translate(-95,-88)';

export const LOGO_SHIELD = {
  d: 'M63 50 L127 50 L127 88 C127 110 112 124 95 132 C78 124 63 110 63 88 Z',
  stroke: '#8A0303',
  strokeWidth: 5,
} as const;

export const LOGO_ARCS = [
  { d: 'M95 68 A20 20 0 0 1 115 88', stroke: '#C8102E' },
  { d: 'M115 88 A20 20 0 0 1 95 108', stroke: '#F2B705' },
  { d: 'M95 108 A20 20 0 0 1 75 88', stroke: '#E83E8C' },
  { d: 'M75 88 A20 20 0 0 1 95 68', stroke: '#2E9E4F' },
] as const;

export const LOGO_ARC_WIDTH = 6;
