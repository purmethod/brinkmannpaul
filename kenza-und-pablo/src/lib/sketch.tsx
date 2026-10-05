import {getLength} from '@remotion/paths';
import rough from 'roughjs';
import type {Drawable, Options} from 'roughjs/bin/core';
import {useCurrentFrame} from 'remotion';

// Farben: Fineliner-Tinte auf Kraftpapier, Buntstift nur gezielt.
export const C = {
  ink: '#2a211b',
  paper: '#c9a67b',
  white: '#efe2c8',
  rosa: '#E8A0A8',
  senf: '#D9A93B',
  rot: '#C0392B',
  salbei: '#8FA67A',
  hair: '#2a211b',
  denim: '#4b4a52',
  teal: '#3f9e9b',
  orange: '#e8873a',
  violet: '#6e4e9e',
};

export type P = [number, number];

type Kind = 'solid' | 'outline' | 'hatch';
export type Stroke = {d: string; kind: Kind; color: string; width: number};
export type Mark = Stroke[];

const BASE: Options = {
  stroke: C.ink,
  strokeWidth: 2.3,
  roughness: 1.1,
  bowing: 1.1,
  hachureGap: 5,
  fillWeight: 1.5,
  hachureAngle: -40,
};

export const hatch = (color: string, extra: Options = {}): Options => ({
  fill: color,
  fillStyle: 'hachure',
  ...extra,
});
export const solid = (color: string): Options => ({fill: color, fillStyle: 'solid'});
// Papierfarbene Fläche: verdeckt, was dahinter liegt, wirkt aber "ungefüllt".
export const paperFill = solid(C.paper);

const gen = rough.generator();

/** Sammelt rough.js-Formen; jede Form bekommt einen eigenen, deterministischen Seed. */
export class Sketch {
  marks: Mark[] = [];
  private n = 0;
  constructor(private seed: number) {}

  private opt(o?: Options): Options {
    this.n++;
    const s = Math.abs((this.seed * 2654435761 + this.n * 40503) % 2147483646) + 1;
    return {...BASE, ...o, seed: s};
  }

  private add(dr: Drawable) {
    const o = dr.options;
    const solids: Stroke[] = [];
    const outlines: Stroke[] = [];
    const hatches: Stroke[] = [];
    for (const set of dr.sets) {
      const d = gen.opsToPath(set, 2);
      if (set.type === 'fillPath') solids.push({d, kind: 'solid', color: o.fill ?? 'none', width: 0});
      else if (set.type === 'fillSketch')
        hatches.push({d, kind: 'hatch', color: o.fill ?? C.ink, width: o.fillWeight});
      else if (o.stroke !== 'none') outlines.push({d, kind: 'outline', color: o.stroke, width: o.strokeWidth});
    }
    // Zeichenreihenfolge wie von Hand: Fläche, Kontur, dann Schraffur.
    this.marks.push([...solids, ...outlines, ...hatches]);
    return this;
  }

  circle(x: number, y: number, d: number, o?: Options) {
    return this.add(gen.circle(x, y, d, this.opt(o)));
  }
  ellipse(x: number, y: number, w: number, h: number, o?: Options) {
    return this.add(gen.ellipse(x, y, w, h, this.opt(o)));
  }
  line(a: P, b: P, o?: Options) {
    return this.add(gen.line(a[0], a[1], b[0], b[1], this.opt(o)));
  }
  /** under=true: papierfarbene Unterlage, damit Schraffur nichts Dahinterliegendes durchscheinen lässt */
  poly(pts: P[], o?: Options, under = false) {
    if (under) this.add(gen.polygon(pts, this.opt({...paperFill, stroke: 'none'})));
    return this.add(gen.polygon(pts, this.opt(o)));
  }
  lines(pts: P[], o?: Options) {
    return this.add(gen.linearPath(pts, this.opt(o)));
  }
  curve(pts: P[], o?: Options) {
    return this.add(gen.curve(pts, this.opt(o)));
  }
  path(d: string, o?: Options, under = false) {
    if (under) this.add(gen.path(d, this.opt({...paperFill, stroke: 'none'})));
    return this.add(gen.path(d, this.opt(o)));
  }
}

/** Boiling lines: neuer Seed alle 4 Frames, deterministisch aus der Frame-Nummer. */
export const useBoil = (base: number) => {
  const frame = useCurrentFrame();
  return base * 7919 + Math.floor(frame / 4) * 104729;
};

const W: Record<Kind, number> = {solid: 0, outline: 1, hatch: 0.6};

/**
 * Teilt einen Pfad in seine Unterpfade und zeichnet sie nacheinander (nach Länge gewichtet),
 * damit der Strich wirklich wie ein Stift von Anfang bis Ende läuft.
 */
const partialSubpaths = (k: Stroke, p: number) => {
  const subs = k.d.split(/(?=M)/).filter((x) => x.trim().length > 0);
  const lens = subs.map((d) => (k.kind === 'hatch' ? 1 : Math.max(0.001, getLength(d))));
  const sum = lens.reduce((a, b) => a + b, 0);
  let acc = 0;
  const out: {d: string; dash: Record<string, number | string>}[] = [];
  for (let j = 0; j < subs.length; j++) {
    const local = (p * sum - acc) / lens[j];
    acc += lens[j];
    if (local <= 0) break;
    out.push({
      d: subs[j],
      dash: local >= 1 ? {} : {pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - local},
    });
  }
  return out;
};

/** Rendert Marks; progress < 1 zeichnet sie Strich für Strich (stroke-dashoffset). */
export const Ink: React.FC<{marks: Mark[]; progress?: number; opacity?: number}> = ({
  marks,
  progress = 1,
  opacity = 1,
}) => {
  if (progress <= 0) return null;
  const flat = marks.flat();
  const total = flat.reduce((s, k) => s + W[k.kind], 0) || 1;
  let acc = 0;
  let lastStart = 0;
  return (
    <g opacity={opacity}>
      {flat.map((k, i) => {
        const start = acc;
        acc += W[k.kind];
        if (k.kind === 'solid') {
          // Fläche erscheint, sobald ihre Form angefangen wird.
          lastStart = start;
          return progress * total > lastStart || progress >= 1 ? (
            <path key={i} d={k.d} fill={k.color} stroke="none" />
          ) : null;
        }
        const p = progress >= 1 ? 1 : Math.min(1, Math.max(0, (progress * total - start) / W[k.kind]));
        if (p <= 0) return null;
        const common = {
          fill: 'none',
          stroke: k.color,
          strokeWidth: k.width,
          strokeLinecap: 'round' as const,
          strokeLinejoin: 'round' as const,
          opacity: k.kind === 'hatch' ? 0.85 : 1,
        };
        if (p >= 1) return <path key={i} d={k.d} {...common} />;
        return <g key={i}>{partialSubpaths(k, p).map((sp, j) => <path key={j} d={sp.d} {...common} {...sp.dash} />)}</g>;
      })}
    </g>
  );
};

// Geometrie-Helfer
export const deg = (a: number) => (a * Math.PI) / 180;
export const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
export const polar = (len: number, angleFromDown: number): P => [
  len * Math.sin(deg(angleFromDown)),
  len * Math.cos(deg(angleFromDown)),
];
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Röhre entlang einer Polylinie (Arme, Beine) als Polygon. */
export const tube = (pts: P[], widths: number[]): P[] => {
  const left: P[] = [];
  const right: P[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l;
    const ny = dx / l;
    const w = widths[i] / 2;
    left.push([p[0] + nx * w, p[1] + ny * w]);
    right.push([p[0] - nx * w, p[1] - ny * w]);
  });
  return [...left, ...right.reverse()];
};

export const heartPath = (cx: number, cy: number, s: number) =>
  `M ${cx} ${cy + s * 0.45} C ${cx - s * 1.15} ${cy - s * 0.25} ${cx - s * 0.55} ${cy - s * 1.05} ${cx} ${
    cy - s * 0.45
  } C ${cx + s * 0.55} ${cy - s * 1.05} ${cx + s * 1.15} ${cy - s * 0.25} ${cx} ${cy + s * 0.45} Z`;
