import {getLength, getPointAtLength, getTangentAtLength} from '@remotion/paths';
import {C, Ink, P, Sketch, clamp01, deg, hatch, useBoil} from '../lib/sketch';
import {PenTip} from './DoodleFX';

const rotPts = (pts: P[], at: P, angle: number): P[] => {
  const s = Math.sin(deg(angle));
  const k = Math.cos(deg(angle));
  return pts.map(([x, y]) => [at[0] + x * k - y * s, at[1] + x * s + y * k]);
};

/** Blatt wie auf dem Cover: Mandelform, Mittelrippe, Seitenadern. angle: Richtung der Spitze (0 = rechts). */
export const drawLeaf = (sk: Sketch, at: P, angle: number, len: number) => {
  const w = len * 0.32;
  const outline: P[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    outline.push([t * len, -Math.sin(t * Math.PI) * w * (1 - 0.25 * t)]);
  }
  for (let i = 10; i >= 0; i--) {
    const t = i / 10;
    outline.push([t * len, Math.sin(t * Math.PI) * w * (1 - 0.25 * t)]);
  }
  sk.curve(rotPts(outline, at, angle), {...hatch(C.salbei, {hachureGap: 3.6, hachureAngle: angle + 60}), strokeWidth: 2});
  sk.line(...(rotPts([[0, 0], [len * 0.92, 0]], at, angle) as [P, P]), {strokeWidth: 1.4});
  for (const t of [0.3, 0.55]) {
    for (const sd of [-1, 1]) {
      const [a, b] = rotPts([[t * len, 0], [(t + 0.15) * len, sd * w * 0.7]], at, angle);
      sk.line(a, b, {strokeWidth: 1.1, roughness: 0.6});
    }
  }
};

/** Rose: Knospe (open=0) bis halb offen (open≈0.6) bis volle Blüte (open=1). Basis bei (x,y), zeigt nach angle. */
export const Rose: React.FC<{x: number; y: number; angle?: number; open?: number; size?: number; draw?: number; seed?: number}> = ({
  x,
  y,
  angle = 0,
  open = 0,
  size = 1,
  draw = 1,
  seed = 5,
}) => {
  const sk = new Sketch(useBoil(seed));
  const o = clamp01(open);
  const petal = (len: number, wid: number, a: number, base: P): P[] => {
    const pts: P[] = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push([-wid * Math.sin(Math.PI * t) * (1 - 0.3 * t), -len * t]);
    }
    for (let i = 7; i >= 1; i--) {
      const t = i / 8;
      pts.push([wid * Math.sin(Math.PI * t) * (1 - 0.3 * t), -len * t]);
    }
    return rotPts(pts, base, a);
  };
  // Kelchblätter
  for (const sd of [-1, 1]) {
    sk.curve(petal(26, 9, sd * (28 + 40 * o), [0, 0]), {...hatch(C.salbei, {hachureGap: 3}), strokeWidth: 1.8});
  }
  // äußere Blütenblätter öffnen sich
  if (o > 0.02) {
    for (const sd of [-1, 1]) {
      sk.curve(petal(28 + 22 * o, 26 + 16 * o, sd * (18 + 52 * o), [0, -8]), {...hatch(C.rot, {hachureGap: 3.4, hachureAngle: 30 * sd}), strokeWidth: 2});
    }
  }
  if (o > 0.25) {
    for (const sd of [-1, 1]) {
      sk.curve(petal(30 + 14 * o, 22 + 8 * o, sd * (6 + 28 * o), [0, -10]), {...hatch(C.rot, {hachureGap: 3.8, hachureAngle: -30 * sd}), strokeWidth: 2});
    }
  }
  // Knospe / Herz der Rose
  const bw = 15 + 6 * o;
  const bh = 44 - 8 * o;
  sk.path(`M 0 -4 C ${-bw} -10 ${-bw} ${-bh * 0.75} 0 ${-bh} C ${bw} ${-bh * 0.75} ${bw} -10 0 -4 Z`, {
    ...hatch(C.rot, {hachureGap: 2.8, fillWeight: 1.7}),
    strokeWidth: 2.2,
  });
  sk.path(`M ${-bw * 0.6} ${-bh * 0.45} Q 0 ${-bh * 0.2} ${bw * 0.5} ${-bh * 0.6}`, {strokeWidth: 1.6});
  if (o > 0.4) sk.path(`M -6 ${-bh * 0.75} Q 6 ${-bh * 0.95} 7 ${-bh * 0.7} Q 2 ${-bh * 0.55} -4 ${-bh * 0.66}`, {strokeWidth: 1.6});

  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${size})`}>
      <Ink marks={sk.marks} progress={draw} />
    </g>
  );
};

export type VineSpec = {d: string; leaves: {t: number; side: 1 | -1; len?: number}[]; width?: number};

/** Ranke zeichnet sich entlang ihres Pfads; Blätter sprießen, sobald der Stift vorbei ist. */
export const Vine: React.FC<{spec: VineSpec; progress: number; pen?: boolean; seed: number}> = ({spec, progress, pen = false, seed}) => {
  const boil = useBoil(seed);
  const p = clamp01(progress);
  if (p <= 0) return null;
  const total = getLength(spec.d);
  const stem = new Sketch(boil);
  stem.path(spec.d, {strokeWidth: spec.width ?? 3, roughness: 0.9, disableMultiStroke: true});
  stem.path(spec.d, {strokeWidth: 1.4, roughness: 1.4, disableMultiStroke: true});
  const leaves = spec.leaves.map((lf, i) => {
    const lp = clamp01((p - lf.t) / 0.12);
    if (lp <= 0) return null;
    const L = lf.t * total;
    const at = getPointAtLength(spec.d, L)!;
    const tg = getTangentAtLength(spec.d, L)!;
    const a = (Math.atan2(tg.y, tg.x) * 180) / Math.PI + lf.side * 48;
    const sk = new Sketch(boil + i * 17);
    drawLeaf(sk, [at.x, at.y], a, (lf.len ?? 54) * (0.4 + 0.6 * lp));
    return <Ink key={i} marks={sk.marks} progress={Math.min(1, lp * 1.6)} />;
  });
  const tip = getPointAtLength(spec.d, p * total)!;
  return (
    <g>
      {stem.marks.map((m, i) => (
        <Ink key={`s${i}`} marks={[m]} progress={p} />
      ))}
      {leaves}
      {pen && p < 1 ? <PenTip x={tip.x} y={tip.y} seed={seed + 3} /> : null}
    </g>
  );
};

export const vineEnd = (d: string): {x: number; y: number; angle: number} => {
  const L = getLength(d);
  const pt = getPointAtLength(d, L)!;
  const tg = getTangentAtLength(d, L - 0.5)!;
  return {x: pt.x, y: pt.y, angle: (Math.atan2(tg.y, tg.x) * 180) / Math.PI + 90};
};
