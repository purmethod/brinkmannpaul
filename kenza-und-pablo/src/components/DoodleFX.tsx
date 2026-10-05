import {C, Ink, P, Sketch, deg, hatch, heartPath, paperFill, solid, useBoil} from '../lib/sketch';

const rot = (p: P, c: P, a: number): P => {
  const s = Math.sin(deg(a));
  const k = Math.cos(deg(a));
  const dx = p[0] - c[0];
  const dy = p[1] - c[1];
  return [c[0] + dx * k - dy * s, c[1] + dx * s + dy * k];
};

/** Handy in der Hand; Kartenpfeil dreht sich (spin in Grad). */
export const drawPhone = (sk: Sketch, hand: P, angle: number, spin: number) => {
  const c: P = [hand[0] + 4, hand[1] - 18];
  const box = (w: number, h: number): P[] =>
    [[-w, -h], [w, -h], [w, h], [-w, h]].map(([x, y]) => rot([c[0] + x, c[1] + y], c, angle));
  sk.poly(box(15, 26), {...hatch(C.ink, {hachureGap: 2.6}), strokeWidth: 2.2});
  sk.poly(box(11, 20), {...solid(C.white), strokeWidth: 1.2});
  const tip = rot([c[0], c[1] - 10], c, angle + spin);
  const l = rot([c[0] - 6, c[1] + 7], c, angle + spin);
  const r = rot([c[0] + 6, c[1] + 7], c, angle + spin);
  sk.poly([tip, r, c, l], {...solid(C.rot), stroke: C.rot, strokeWidth: 1.2, roughness: 0.6});
  // Hand-Daumen über dem Handy
  sk.circle(hand[0] - 2, hand[1] - 2, 14, {...paperFill, strokeWidth: 2});
};

export const Heart: React.FC<{x: number; y: number; size: number; color?: string; draw?: number; seed: number; opacity?: number}> = ({
  x,
  y,
  size,
  color = C.rot,
  draw = 1,
  seed,
  opacity = 1,
}) => {
  const sk = new Sketch(useBoil(seed));
  sk.path(heartPath(x, y, size), {...hatch(color, {hachureGap: Math.max(3, size / 6), fillWeight: 1.8}), strokeWidth: 2.2});
  return <Ink marks={sk.marks} progress={draw} opacity={opacity} />;
};

export const QuestionMark: React.FC<{x: number; y: number; size?: number; draw?: number; seed: number; opacity?: number}> = ({
  x,
  y,
  size = 1,
  draw = 1,
  seed,
  opacity = 1,
}) => {
  const sk = new Sketch(useBoil(seed));
  const s = size;
  sk.path(`M ${x - 18 * s} ${y - 22 * s} C ${x - 18 * s} ${y - 48 * s} ${x + 22 * s} ${y - 50 * s} ${x + 20 * s} ${y - 22 * s} C ${x + 18 * s} ${y - 6 * s} ${x} ${y - 4 * s} ${x} ${y + 12 * s}`, {
    strokeWidth: 4,
  });
  sk.circle(x, y + 28 * s, 8 * s, {...solid(C.ink)});
  return <Ink marks={sk.marks} progress={draw} opacity={opacity} />;
};

export const Exclamation: React.FC<{x: number; y: number; size?: number; draw?: number; seed: number; opacity?: number}> = ({
  x,
  y,
  size = 1,
  draw = 1,
  seed,
  opacity = 1,
}) => {
  const sk = new Sketch(useBoil(seed));
  const s = size;
  sk.poly([[x - 6 * s, y - 40 * s], [x + 6 * s, y - 40 * s], [x + 2 * s, y + 8 * s], [x - 2 * s, y + 8 * s]], {
    ...hatch(C.ink, {hachureGap: 2.5}),
    strokeWidth: 2.6,
  });
  sk.circle(x, y + 22 * s, 9 * s, {...solid(C.ink)});
  // kleine Schreck-Striche
  sk.line([x - 26 * s, y - 34 * s], [x - 16 * s, y - 22 * s], {strokeWidth: 2.4});
  sk.line([x + 26 * s, y - 34 * s], [x + 16 * s, y - 22 * s], {strokeWidth: 2.4});
  return <Ink marks={sk.marks} progress={draw} opacity={opacity} />;
};

/** Kleines Glitzer-Sternchen */
export const Sparkle: React.FC<{x: number; y: number; size: number; color?: string; seed: number; opacity?: number}> = ({
  x,
  y,
  size,
  color = C.senf,
  seed,
  opacity = 1,
}) => {
  const sk = new Sketch(useBoil(seed));
  const s = size;
  sk.path(`M ${x} ${y - s} Q ${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y} Q ${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s} Q ${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y} Q ${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s} Z`, {
    ...solid(color),
    strokeWidth: 1.8,
  });
  return <Ink marks={sk.marks} opacity={opacity} />;
};

/** Fineliner, dessen Spitze auf (x, y) zeichnet. */
export const PenTip: React.FC<{x: number; y: number; seed: number; opacity?: number}> = ({x, y, seed, opacity = 1}) => {
  const sk = new Sketch(useBoil(seed));
  const a = -35; // Stift schräg nach rechts oben
  const pt = (dx: number, dy: number): P => rot([x + dx, y + dy], [x, y], a);
  sk.poly([pt(0, 0), pt(6, -16), pt(-6, -16)], {...solid(C.ink), strokeWidth: 1.5});
  sk.poly([pt(-11, -16), pt(11, -16), pt(13, -40), pt(-13, -40)], {...solid('#d9d2c3'), strokeWidth: 2});
  sk.poly([pt(-14, -40), pt(14, -40), pt(14, -150), pt(-14, -150)], {...hatch('#3d3a36', {hachureGap: 3.5}), strokeWidth: 2});
  sk.line(pt(15, -66), pt(15, -128), {strokeWidth: 3});
  return (
    <g opacity={opacity}>
      <Ink marks={sk.marks} />
    </g>
  );
};
