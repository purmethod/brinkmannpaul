import {Easing, interpolate} from 'remotion';

/** 0..1-Fortschritt zwischen zwei Frames, geklemmt, optional mit Easing. */
export const progress = (
  frame: number,
  start: number,
  end: number,
  easing: (t: number) => number = Easing.inOut(Easing.cubic),
) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Federndes Überschwingen (Cartoon "Squash & Stretch"). */
export const overshoot = (t: number, amount = 1.6) => {
  const c = amount;
  const x = t - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};
