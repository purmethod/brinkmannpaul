import {C, Ink, P, Sketch, add, hatch, paperFill, polar, solid, tube, useBoil} from '../lib/sketch';
import {FaceStyle, FigureProps, Spec, computeRig, drawFace, figureTransform, toWorld} from './figure';
import {drawPhone} from './DoodleFX';

// Zierlich, großer Kopf. Lokale Koordinaten: Füße auf y=0, Blick nach +x.
export const KENZA: Spec = {
  leg: 104,
  hipW: 11,
  shoulderY: -204,
  shoulderW: 27,
  upper: 50,
  fore: 48,
  headY: -284,
};

const FACE: FaceStyle = {
  eyeDx: 23,
  eyeY: 4,
  eyeW: 26,
  eyeH: 33,
  browY: -17,
  browW: 22,
  browWeight: 2.6,
  mouthY: 40,
  noseY: 24,
  lashes: true,
};

export type KenzaProps = FigureProps & {holding?: 'phone'; phoneSpin?: number};

export const kenzaHand = (props: KenzaProps, which: 0 | 1 = 0): P =>
  toWorld(props, computeRig(KENZA, props).hand[which]);

export const Kenza: React.FC<KenzaProps> = (props) => {
  const seed = useBoil(props.seed ?? 11);
  const r = computeRig(KENZA, props);
  const sk = new Sketch(seed);
  const [hx, hy] = r.head;

  const arm = (i: 0 | 1) => {
    sk.poly(tube([r.shoulder[i], r.elbow[i], r.hand[i]], [13, 12, 11]), {...paperFill});
    // kurzer Ärmel
    const sleeveEnd = add(r.shoulder[i], [(r.elbow[i][0] - r.shoulder[i][0]) * 0.45, (r.elbow[i][1] - r.shoulder[i][1]) * 0.45]);
    sk.poly(tube([r.shoulder[i], sleeveEnd], [22, 21]), {...hatch(C.rosa, {hachureGap: 4.5})});
    sk.circle(r.hand[i][0], r.hand[i][1], 15, {...paperFill});
  };
  const leg = (i: 0 | 1) => {
    sk.poly(tube([r.hip[i], r.knee[i], r.foot[i]], [14, 13, 12]), {...paperFill});
    const f = r.foot[i];
    sk.path(`M ${f[0] - 9} ${f[1] - 4} Q ${f[0] - 10} ${f[1] + 5} ${f[0]} ${f[1] + 5} L ${f[0] + 15} ${f[1] + 5} Q ${f[0] + 16} ${f[1] - 3} ${f[0] + 4} ${f[1] - 6} Z`, {
      ...hatch(C.ink, {hachureGap: 3}),
    });
  };

  // Haar hinten (Volumen) — zuerst, damit der Kopf davor liegt
  sk.ellipse(hx - 9, hy - 2, 150, 150, {...hatch(C.hair, {hachureGap: 3.6, fillWeight: 1.4, hachureAngle: 60})});

  arm(1);
  leg(1);
  leg(0);

  // Oberteil (rosa) + Rock (senf)
  const sy = r.shoulder[0][1];
  const wy = sy + 54;
  sk.poly([[-29, sy - 2], [29, sy - 2], [24, wy], [-24, wy]], {...hatch(C.rosa, {hachureGap: 4.5})}, true);
  sk.poly([[-24, wy], [24, wy], [46, wy + 66], [-46, wy + 66]], {...hatch(C.senf, {hachureGap: 5, hachureAngle: 50})}, true);
  sk.line([-4, wy + 8], [-10, wy + 62], {strokeWidth: 1.4});
  sk.line([10, wy + 8], [16, wy + 62], {strokeWidth: 1.4});

  // Hals + Kopf
  sk.poly(tube([[2, sy + 4], [4, hy + 60]], [15, 15]), {...paperFill});
  sk.ellipse(hx, hy, 134, 142, {...paperFill, strokeWidth: 2.5});

  // Ohren + kleine Ohrringe
  for (const sx of [-1, 1]) {
    const ox = hx + sx * 64;
    sk.path(`M ${ox} ${hy - 6} Q ${ox + sx * 11} ${hy + 4} ${ox} ${hy + 16}`, {strokeWidth: 2.2});
    sk.circle(ox + sx * 1, hy + 24, 9, {...solid(C.senf), strokeWidth: 1.6});
  }

  // Haar vorne: Kappe + Pony mit gerader, leicht zackiger Kante
  const fy = hy - 36;
  sk.path(
    `M ${hx - 68} ${hy + 10} C ${hx - 82} ${hy - 70} ${hx - 30} ${hy - 86} ${hx + 6} ${hy - 82} C ${hx + 50} ${hy - 80} ${hx + 82} ${hy - 50} ${hx + 68} ${hy + 6}
     L ${hx + 60} ${hy - 22} L ${hx + 52} ${fy} L ${hx + 38} ${fy + 4} L ${hx + 26} ${fy - 1} L ${hx + 12} ${fy + 4} L ${hx - 2} ${fy} L ${hx - 16} ${fy + 4} L ${hx - 30} ${fy}
     L ${hx - 44} ${fy + 3} L ${hx - 56} ${fy - 2} L ${hx - 62} ${hy - 16} Z`,
    {...hatch(C.hair, {hachureGap: 3.4, fillWeight: 1.5, hachureAngle: 70}), strokeWidth: 2.4},
    true,
  );

  // Gesicht
  drawFace(sk, [hx, hy], FACE, props.expression ?? 'smile', props.blink ?? 0, props.look ?? {x: 0.3, y: 0});

  // Zopf über der hinteren Schulter
  for (let k = 0; k < 5; k++) {
    const c = add([hx - 60, hy + 40], [-k * 3, k * 19]);
    sk.ellipse(c[0], c[1], 26 - k * 2.5, 24, {...hatch(C.hair, {hachureGap: 3.2, hachureAngle: 20 + k * 30})});
  }
  sk.ellipse(hx - 75, hy + 124, 14, 9, {...solid(C.rosa)});
  sk.lines([[hx - 75, hy + 128], [hx - 82, hy + 146], [hx - 70, hy + 144]], {strokeWidth: 1.6});

  arm(0);
  if (props.holding === 'phone') drawPhone(sk, r.hand[0], -18, props.phoneSpin ?? 0);

  return (
    <g transform={figureTransform(props)}>
      <Ink marks={sk.marks} progress={props.draw ?? 1} />
    </g>
  );
};

// Für Konsistenz anderer Szenen nützlich
export const kenzaHeadTop = (props: KenzaProps): P => toWorld(props, add(computeRig(KENZA, props).head, polar(90, 180)));
