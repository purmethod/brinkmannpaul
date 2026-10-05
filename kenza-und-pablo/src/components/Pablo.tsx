import {C, Ink, P, Sketch, add, hatch, lerp, paperFill, solid, tube, useBoil} from '../lib/sketch';
import {FaceStyle, FigureProps, Spec, computeRig, drawFace, figureTransform, toWorld} from './figure';

// Groß, breite Schultern. Lokale Koordinaten: Füße auf y=0, Blick nach +x.
export const PABLO: Spec = {
  leg: 150,
  hipW: 20,
  shoulderY: -290,
  shoulderW: 50,
  upper: 70,
  fore: 64,
  headY: -372,
};

const FACE: FaceStyle = {
  eyeDx: 25,
  eyeY: -2,
  eyeW: 25,
  eyeH: 30,
  browY: -26,
  browW: 26,
  browWeight: 4.2,
  mouthY: 44,
  noseY: 20,
  lashes: false,
  mouthPatch: true,
};

export type PabloProps = FigureProps;

export const pabloHand = (props: PabloProps, which: 0 | 1 = 0): P =>
  toWorld(props, computeRig(PABLO, props).hand[which]);

const mid = (a: P, b: P, t: number): P => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

export const Pablo: React.FC<PabloProps> = (props) => {
  const seed = useBoil(props.seed ?? 23);
  const r = computeRig(PABLO, props);
  const sk = new Sketch(seed);
  const [hx, hy] = r.head;

  const arm = (i: 0 | 1, watch: boolean) => {
    const cuff = mid(r.shoulder[i], r.elbow[i], 0.92);
    // Unterarm (nackt) + Hand
    sk.poly(tube([cuff, r.elbow[i], r.hand[i]], [19, 18, 16]), {...paperFill});
    sk.circle(r.hand[i][0], r.hand[i][1], 21, {...paperFill});
    // Hemdärmel bis knapp über den Ellbogen, hochgekrempelt
    sk.poly(tube([r.shoulder[i], cuff], [32, 28]), {...hatch(C.salbei, {hachureGap: 5})}, true);
    sk.poly(tube([mid(r.shoulder[i], r.elbow[i], 0.78), mid(r.shoulder[i], r.elbow[i], 0.98)], [34, 34]), {
      ...hatch(C.salbei, {hachureGap: 3, hachureAngle: 45}),
    });
    if (watch) {
      const w1 = mid(r.elbow[i], r.hand[i], 0.72);
      const w2 = mid(r.elbow[i], r.hand[i], 0.84);
      sk.poly(tube([w1, w2], [21, 21]), {...hatch(C.ink, {hachureGap: 2.5})});
      const wc = mid(w1, w2, 0.5);
      sk.circle(wc[0], wc[1], 13, {...solid(C.senf), strokeWidth: 1.8});
    }
  };
  const leg = (i: 0 | 1) => {
    sk.poly(tube([r.hip[i], r.knee[i], r.foot[i]], [34, 30, 27]), {...hatch(C.denim, {hachureGap: 4.5, hachureAngle: 70})});
    const f = r.foot[i];
    sk.path(`M ${f[0] - 15} ${f[1] - 6} Q ${f[0] - 16} ${f[1] + 6} ${f[0]} ${f[1] + 6} L ${f[0] + 24} ${f[1] + 6} Q ${f[0] + 26} ${f[1] - 4} ${f[0] + 6} ${f[1] - 9} Z`, {
      ...hatch(C.ink, {hachureGap: 3}),
    });
  };

  arm(1, false);
  leg(1);
  leg(0);

  // Hemd
  const sy = r.shoulder[0][1];
  const hemY = r.hip[0][1] + 16;
  sk.poly([[-54, sy - 2], [54, sy - 2], [48, hemY], [-48, hemY]], {...hatch(C.salbei, {hachureGap: 5})}, true);
  sk.line([4, sy + 22], [5, hemY - 4], {strokeWidth: 1.6});
  for (let k = 0; k < 4; k++) sk.circle(11, sy + 34 + k * 26, 5, {...paperFill, strokeWidth: 1.4});
  sk.poly([[-38, sy + 30], [-14, sy + 30], [-15, sy + 56], [-37, sy + 56]], {strokeWidth: 1.6});

  // Hals, Kragen, Kopf
  sk.poly(tube([[4, sy + 4], [5, hy + 64]], [26, 26]), {...paperFill});
  sk.poly([[-22, sy - 6], [4, sy + 22], [-4, sy + 30], [-28, sy + 2]], {...paperFill, strokeWidth: 2});
  sk.poly([[30, sy - 6], [4, sy + 22], [14, sy + 30], [36, sy + 2]], {...paperFill, strokeWidth: 2});
  sk.ellipse(hx, hy, 140, 154, {...paperFill, strokeWidth: 2.5});

  // Ohren
  for (const sx of [-1, 1]) {
    const ox = hx + sx * 68;
    sk.path(`M ${ox} ${hy - 12} Q ${ox + sx * 13} ${hy - 2} ${ox} ${hy + 12}`, {strokeWidth: 2.3});
  }

  // Vollbart: Kinn + Wangen, dichte Kritzelschraffur
  sk.path(
    `M ${hx - 69} ${hy - 34} L ${hx - 68} ${hy - 6} C ${hx - 70} ${hy + 50} ${hx - 40} ${hy + 92} ${hx + 4} ${hy + 96} C ${hx + 50} ${hy + 92} ${hx + 74} ${hy + 50} ${hx + 70} ${hy - 6} L ${hx + 70} ${hy - 34} L ${hx + 60} ${hy - 34} L ${hx + 62} ${hy - 6}
     C ${hx + 62} ${hy + 14} ${hx + 50} ${hy + 30} ${hx + 32} ${hy + 30} L ${hx + 8} ${hy + 30} L ${hx - 18} ${hy + 30} C ${hx - 40} ${hy + 30} ${hx - 60} ${hy + 14} ${hx - 60} ${hy - 6} L ${hx - 58} ${hy - 34} Z`,
    {...hatch(C.ink, {hachureGap: 3.2, fillWeight: 1.3, hachureAngle: 75}), strokeWidth: 2.2},
    true,
  );

  drawFace(sk, [hx, hy], FACE, props.expression ?? 'smile', props.blink ?? 0, props.look ?? {x: 0.3, y: 0});
  // Schnurrbart über dem Mund
  sk.path(`M ${hx - 18} ${hy + 38} Q ${hx + 9} ${hy + 28} ${hx + 36} ${hy + 38}`, {strokeWidth: 5, roughness: 1.4});

  // Beanie mit Krempe
  sk.path(
    `M ${hx - 72} ${hy - 40} C ${hx - 78} ${hy - 118} ${hx + 82} ${hy - 118} ${hx + 74} ${hy - 40} Z`,
    {...hatch(C.senf, {hachureGap: 4.5, hachureAngle: -30})},
    true,
  );
  sk.poly(
    [[hx - 78, hy - 56], [hx + 80, hy - 56], [hx + 78, hy - 32], [hx - 76, hy - 32]],
    {...hatch(C.senf, {hachureGap: 3.2, hachureAngle: 60})},
    true,
  );
  for (let k = -3; k <= 3; k++) sk.line([hx + k * 21, hy - 54], [hx + k * 21 + 1, hy - 35], {strokeWidth: 1.3});

  arm(0, true);

  return (
    <g transform={figureTransform(props)}>
      <Ink marks={sk.marks} progress={props.draw ?? 1} />
    </g>
  );
};

export const pabloHeadTop = (props: PabloProps): P => toWorld(props, add(computeRig(PABLO, props).head, [0, -100]));
