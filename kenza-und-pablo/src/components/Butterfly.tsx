import {C, Ink, P, Sketch, hatch, solid, useBoil} from '../lib/sketch';

/** Schmetterling = Kenza. flap: 0..1 (Flügelöffnung), angle: Flugneigung in Grad. */
export const Butterfly: React.FC<{x: number; y: number; flap: number; angle?: number; size?: number; draw?: number; seed?: number}> = ({
  x,
  y,
  flap,
  angle = 0,
  size = 1,
  draw = 1,
  seed = 41,
}) => {
  const sk = new Sketch(useBoil(seed));
  const f = 0.15 + 0.85 * flap;
  const wing = (pts: P[], sd: 1 | -1): P[] => pts.map(([px, py]) => [sd * px * f, py]);
  for (const sd of [-1, 1] as const) {
    // Oberflügel: türkis mit orangem Band, violette Punkte
    sk.curve(wing([[2, -4], [26, -34], [52, -38], [58, -18], [40, 4], [4, 4]], sd), {
      ...hatch(C.teal, {hachureGap: 3.2, hachureAngle: 60 * sd}),
      strokeWidth: 2,
    });
    sk.curve(wing([[20, -16], [38, -26], [48, -20], [36, -6]], sd), {...hatch(C.orange, {hachureGap: 2.6}), strokeWidth: 1.4});
    // Unterflügel: orange/violett
    sk.curve(wing([[3, 4], [34, 8], [40, 30], [22, 40], [6, 18]], sd), {
      ...hatch(C.orange, {hachureGap: 3, hachureAngle: -50 * sd}),
      strokeWidth: 2,
    });
    sk.circle(sd * 24 * f, 26, 7 * Math.max(0.4, f), {...solid(C.violet), strokeWidth: 1.2});
    sk.circle(sd * 48 * f, -28, 5 * Math.max(0.4, f), {...solid(C.violet), strokeWidth: 1.2});
  }
  sk.ellipse(0, 6, 8, 40, {...solid(C.ink)});
  sk.circle(0, -16, 9, {...solid(C.ink)});
  sk.path('M -2 -18 Q -10 -36 -16 -40', {strokeWidth: 1.5});
  sk.path('M 2 -18 Q 10 -36 16 -40', {strokeWidth: 1.5});
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${size})`}>
      <Ink marks={sk.marks} progress={draw} />
    </g>
  );
};
