import {C, P, Sketch, add, hatch, lerp, paperFill, polar, solid} from '../lib/sketch';

export type Expression = 'neutral' | 'smile' | 'bigSmile' | 'surprised' | 'shy' | 'grin' | 'searching';

/** Arm-Winkel in Grad, gemessen von "hängt gerade runter"; positiv = Richtung Blickrichtung. */
export type ArmAngles = [number, number];
export type PoseAngles = {front: ArmAngles; back: ArmAngles; swing: [number, number]};
export type PoseName = 'stand' | 'phone' | 'reach' | 'handOut' | 'wave' | 'hips';
export type Pose = PoseName | PoseAngles;

export const POSES: Record<PoseName, PoseAngles> = {
  stand: {front: [10, 6], back: [-10, -6], swing: [1, 1]},
  phone: {front: [18, 118], back: [-10, -6], swing: [0, 1]},
  reach: {front: [62, 18], back: [-10, -6], swing: [0, 1]},
  handOut: {front: [40, 22], back: [-12, -8], swing: [0, 1]},
  wave: {front: [150, 25], back: [-10, -6], swing: [0, 1]},
  hips: {front: [40, -95], back: [-40, 95], swing: [0, 0]},
};

export const resolvePose = (p: Pose): PoseAngles => (typeof p === 'string' ? POSES[p] : p);

export const blendPose = (a: Pose, b: Pose, t: number): PoseAngles => {
  const A = resolvePose(a);
  const B = resolvePose(b);
  const m = (x: [number, number], y: [number, number]): [number, number] => [lerp(x[0], y[0], t), lerp(x[1], y[1], t)];
  return {front: m(A.front, B.front), back: m(A.back, B.back), swing: m(A.swing, B.swing)};
};

export type FigureProps = {
  x: number;
  y: number;
  scale?: number;
  /** -1..1: Blickrichtung als horizontale Skalierung; Zwischenwerte = Umdrehen. */
  turn?: number;
  pose?: Pose;
  /** Phase des Laufzyklus (beliebige Zahl, 1 = ein Doppelschritt); undefined = steht. */
  walkCycle?: number;
  expression?: Expression;
  /** 0 = Augen offen, 1 = zu */
  blink?: number;
  /** Pupillen-Richtung, -1..1 (lokal, +x = Blickrichtung) */
  look?: {x: number; y: number};
  draw?: number;
  seed?: number;
};

export type Spec = {
  leg: number;
  hipW: number;
  shoulderY: number;
  shoulderW: number;
  upper: number;
  fore: number;
  headY: number;
};

export type Rig = {
  bob: number;
  hip: [P, P];
  foot: [P, P];
  knee: [P, P];
  shoulder: [P, P]; // [vorne, hinten]
  elbow: [P, P];
  hand: [P, P];
  head: P;
};

export const computeRig = (spec: Spec, props: FigureProps): Rig => {
  const pose = resolvePose(props.pose ?? 'stand');
  const walking = props.walkCycle !== undefined;
  const s = walking ? Math.sin((props.walkCycle as number) * Math.PI * 2) : 0;
  const legA = walking ? 24 * s : 4;
  const bob = spec.leg * (1 - Math.cos((Math.abs(legA) * Math.PI) / 180));
  const hipY = -spec.leg + bob;
  const hipF: P = [spec.hipW, hipY];
  const hipB: P = [-spec.hipW, hipY];
  // Leicht gebeugtes Knie am Schwungbein
  const kneeBendF = walking ? Math.max(0, -s) * 18 : 0;
  const kneeBendB = walking ? Math.max(0, s) * 18 : 0;
  const kneeF = add(hipF, polar(spec.leg / 2, legA));
  const kneeB = add(hipB, polar(spec.leg / 2, -legA));
  const footF = add(kneeF, polar(spec.leg / 2, legA - kneeBendF));
  const footB = add(kneeB, polar(spec.leg / 2, -legA - kneeBendB));

  const sh = spec.shoulderY + bob;
  const swing = walking ? 22 * s : 0;
  const shF: P = [spec.shoulderW, sh];
  const shB: P = [-spec.shoulderW, sh];
  const fa1 = pose.front[0] - swing * pose.swing[0];
  const ba1 = pose.back[0] - swing * pose.swing[1];
  const elF = add(shF, polar(spec.upper, fa1));
  const elB = add(shB, polar(spec.upper, ba1));
  const haF = add(elF, polar(spec.fore, fa1 + pose.front[1]));
  const haB = add(elB, polar(spec.fore, ba1 + pose.back[1]));
  return {
    bob,
    hip: [hipF, hipB],
    knee: [kneeF, kneeB],
    foot: [footF, footB],
    shoulder: [shF, shB],
    elbow: [elF, elB],
    hand: [haF, haB],
    head: [0, spec.headY + bob],
  };
};

/** Lokaler Punkt -> Bildkoordinate (für Faden, Effekte). */
// Kritzel-Umdrehen: nur kurz stauchen, dann spiegeln
const turnScale = (t: number) => Math.sign(t || 1) * Math.max(0.55, Math.abs(t));

export const toWorld = (props: FigureProps, p: P): P => {
  const sc = props.scale ?? 1;
  return [props.x + p[0] * sc * turnScale(props.turn ?? 1), props.y + p[1] * sc];
};

export const figureTransform = (props: FigureProps) => {
  const sc = props.scale ?? 1;
  return `translate(${props.x} ${props.y}) scale(${sc * turnScale(props.turn ?? 1)} ${sc})`;
};

// ---------- Gesicht ----------

export type FaceStyle = {
  eyeDx: number;
  eyeY: number;
  eyeW: number;
  eyeH: number;
  browY: number;
  browW: number;
  browWeight: number;
  mouthY: number;
  noseY: number;
  lashes: boolean;
  /** Bei Bart: papierfarbener Ausschnitt um den Mund */
  mouthPatch?: boolean;
};

type ExprDef = {
  eyes: 'open' | 'wide' | 'happy';
  raise: number;
  inner: number;
  asym: number;
  mouth: 'line' | 'smile' | 'open' | 'o' | 'small' | 'grin' | 'wavy';
  blush: boolean;
};

const EXPR: Record<Expression, ExprDef> = {
  neutral: {eyes: 'open', raise: 0, inner: 0, asym: 0, mouth: 'line', blush: false},
  smile: {eyes: 'open', raise: 2, inner: 0, asym: 0, mouth: 'smile', blush: false},
  bigSmile: {eyes: 'happy', raise: 4, inner: 0, asym: 0, mouth: 'open', blush: true},
  surprised: {eyes: 'wide', raise: 10, inner: 0, asym: 0, mouth: 'o', blush: false},
  shy: {eyes: 'open', raise: 3, inner: 5, asym: 0, mouth: 'small', blush: true},
  grin: {eyes: 'open', raise: 2, inner: -2, asym: 9, mouth: 'grin', blush: false},
  searching: {eyes: 'open', raise: 3, inner: 7, asym: 0, mouth: 'wavy', blush: false},
};

export const drawFace = (
  sk: Sketch,
  head: P,
  st: FaceStyle,
  expression: Expression,
  blink: number,
  look: {x: number; y: number},
) => {
  const e = EXPR[expression];
  const fx = head[0] + 7; // Gesicht leicht in Blickrichtung gedreht
  const hy = head[1];

  // Wangen
  if (e.blush) {
    for (const sx of [-1, 1]) {
      sk.ellipse(fx + sx * (st.eyeDx + 14), hy + st.eyeY + 24, 26, 13, {
        stroke: 'none',
        ...hatch(C.rosa, {hachureGap: 3.5, fillWeight: 1.8, hachureAngle: -20}),
      });
    }
  }

  // Augen
  for (const sx of [-1, 1]) {
    const ex = fx + sx * st.eyeDx;
    const ey = hy + st.eyeY;
    const closed = e.eyes === 'happy' ? 1 : blink;
    if (closed > 0.75) {
      if (e.eyes === 'happy')
        sk.path(`M ${ex - 11} ${ey + 3} Q ${ex} ${ey - 11} ${ex + 11} ${ey + 3}`, {strokeWidth: 3});
      else sk.path(`M ${ex - 11} ${ey + 1} Q ${ex} ${ey + 7} ${ex + 11} ${ey + 1}`, {strokeWidth: 3});
    } else {
      const wide = e.eyes === 'wide' ? 1.22 : 1;
      const h = st.eyeH * wide * (1 - closed);
      const w = st.eyeW * (e.eyes === 'wide' ? 1.1 : 1);
      sk.ellipse(ex, ey, w, h, {...solid(C.white), strokeWidth: 2.2});
      const pd = e.eyes === 'wide' ? w * 0.38 : w * 0.5;
      const px = ex + look.x * (w / 2 - pd / 2 - 1);
      const py = ey + look.y * Math.max(0, h / 2 - pd / 2 - 1);
      const ph = Math.min(pd, h * 0.9);
      sk.ellipse(px, py, pd, ph, {...solid(C.ink), roughness: 0.6});
      if (ph > 6) sk.circle(px + pd * 0.18, py - ph * 0.2, pd * 0.32, {...solid(C.white), stroke: 'none', roughness: 0.3});
      if (st.lashes && sx === 1) {
        sk.line([ex + w / 2 - 2, ey - h / 2 + 3], [ex + w / 2 + 6, ey - h / 2 - 3], {strokeWidth: 2});
        sk.line([ex + w / 2 - 7, ey - h / 2], [ex + w / 2 - 2, ey - h / 2 - 7], {strokeWidth: 2});
      }
      if (st.lashes && sx === -1) {
        sk.line([ex - w / 2 + 2, ey - h / 2 + 3], [ex - w / 2 - 6, ey - h / 2 - 3], {strokeWidth: 2});
      }
    }
    // Augenbrauen: Bogen; arch = Wölbung, inner = innere Enden hoch (fragend/schüchtern)
    const by = hy + st.browY - e.raise - (sx === 1 ? e.asym : 0);
    const outer: P = [ex + sx * st.browW * 0.55, by + 3];
    const inner: P = [ex - sx * st.browW * 0.45, by + 1 - e.inner];
    const arch = e.eyes === 'wide' ? 10 : 5;
    sk.path(
      `M ${outer[0]} ${outer[1]} Q ${(outer[0] + inner[0]) / 2} ${by - arch - e.inner / 2} ${inner[0]} ${inner[1]}`,
      {strokeWidth: st.browWeight},
    );
  }

  // Nase
  const ny = hy + st.noseY;
  sk.path(`M ${fx + 2} ${ny - 10} Q ${fx + 9} ${ny + 2} ${fx + 1} ${ny + 4}`, {strokeWidth: 2});

  // Mund
  const mx = fx + 2;
  const my = hy + st.mouthY;
  if (st.mouthPatch) sk.ellipse(mx, my + 2, 52, 30, {...paperFill, stroke: 'none'});
  switch (e.mouth) {
    case 'line':
      sk.path(`M ${mx - 12} ${my} Q ${mx} ${my + 3} ${mx + 12} ${my}`, {strokeWidth: 2.6});
      break;
    case 'smile':
      sk.path(`M ${mx - 18} ${my - 3} Q ${mx} ${my + 15} ${mx + 18} ${my - 3}`, {strokeWidth: 2.8});
      break;
    case 'small':
      sk.path(`M ${mx - 10} ${my} Q ${mx} ${my + 8} ${mx + 10} ${my}`, {strokeWidth: 2.6});
      break;
    case 'wavy':
      sk.path(`M ${mx - 13} ${my + 2} Q ${mx - 7} ${my - 4} ${mx} ${my + 1} T ${mx + 13} ${my}`, {strokeWidth: 2.6});
      break;
    case 'o':
      sk.ellipse(mx, my + 3, 15, 19, {...hatch(C.ink, {hachureGap: 2.5, fillWeight: 1.6})});
      break;
    case 'open':
      sk.path(`M ${mx - 24} ${my - 4} Q ${mx} ${my - 1} ${mx + 24} ${my - 4} Q ${mx + 20} ${my + 26} ${mx} ${my + 26} Q ${mx - 20} ${my + 26} ${mx - 24} ${my - 4} Z`, {
        ...hatch(C.ink, {hachureGap: 2.6, fillWeight: 1.5}),
        strokeWidth: 2.6,
      });
      sk.ellipse(mx + 2, my + 18, 22, 10, {...solid(C.rosa), stroke: 'none'});
      break;
    case 'grin':
      sk.path(`M ${mx - 24} ${my - 1} Q ${mx + 2} ${my + 3} ${mx + 27} ${my - 9} Q ${mx + 20} ${my + 18} ${mx} ${my + 17} Q ${mx - 18} ${my + 15} ${mx - 24} ${my - 1} Z`, {
        ...solid(C.white),
        strokeWidth: 2.7,
      });
      sk.path(`M ${mx - 20} ${my + 4} Q ${mx + 2} ${my + 8} ${mx + 23} ${my - 2}`, {strokeWidth: 1.4});
      break;
  }
};
