import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Butterfly} from './components/Butterfly';
import {Exclamation, Heart, QuestionMark} from './components/DoodleFX';
import {Expression, Pose, blendPose} from './components/figure';
import {Kenza, KenzaProps, kenzaHand, kenzaHeadTop} from './components/Kenza';
import {Pablo, PabloProps, pabloHand} from './components/Pablo';
import {PaperBase, PaperGrain} from './components/Paper';
import {RedThread} from './components/RedThread';
import {Rose, Vine, VineSpec, vineEnd} from './components/Vine';
import {C, Ink, Sketch, hatch, useBoil} from './lib/sketch';

const S = 1080;
const GROUND = 900;
const STRIDE = 180;

const ip = (f: number, range: [number, number], out: [number, number], easing?: (t: number) => number) =>
  interpolate(f, range, out, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

/** 0..1..0 Dreieck für Blinzeln */
const pulse = (f: number, start: number, len = 6) => {
  const t = (f - start) / len;
  return t < 0 || t > 1 ? 0 : 1 - Math.abs(t * 2 - 1);
};

const turnCurve = (f: number, start: number, len: number, from: 1 | -1) => {
  const t = ip(f, [start, start + len], [0, 1]);
  return from * Math.cos(Math.PI * t);
};

const VINE: VineSpec = {
  d: 'M 30 1090 C 70 930, 10 780, 55 640 S 60 400, 115 310 S 220 175, 340 150',
  leaves: [
    {t: 0.08, side: 1},
    {t: 0.18, side: -1},
    {t: 0.28, side: 1, len: 52},
    {t: 0.4, side: -1},
    {t: 0.5, side: 1, len: 50},
    {t: 0.61, side: -1},
    {t: 0.71, side: 1},
    {t: 0.81, side: -1, len: 40},
    {t: 0.9, side: 1, len: 36},
  ],
};
const SPRIG: VineSpec = {
  d: 'M 1090 950 C 1020 965, 1000 1020, 920 1040 S 830 1055, 790 1090',
  leaves: [
    {t: 0.2, side: -1, len: 40},
    {t: 0.42, side: 1, len: 44},
    {t: 0.62, side: -1, len: 40},
    {t: 0.82, side: 1, len: 34},
  ],
  width: 2.6,
};
const BUD = vineEnd(VINE.d);

const Ground: React.FC<{progress: number}> = ({progress}) => {
  const sk = new Sketch(useBoil(3));
  sk.path(`M 120 ${GROUND + 4} C 400 ${GROUND - 2}, 700 ${GROUND + 8}, 1030 ${GROUND + 2}`, {strokeWidth: 2.4, roughness: 1.4});
  for (const gx of [190, 470, 620, 960]) {
    sk.lines([[gx - 8, GROUND + 4], [gx - 4, GROUND - 10], [gx, GROUND + 3], [gx + 6, GROUND - 13], [gx + 9, GROUND + 3]], {strokeWidth: 1.6});
  }
  return <Ink marks={sk.marks} progress={progress} />;
};

const Shadow: React.FC<{x: number; w: number; seed: number}> = ({x, w, seed}) => {
  const sk = new Sketch(useBoil(seed));
  sk.ellipse(x, GROUND + 6, w, 18, {stroke: 'none', ...hatch('#6f5638', {hachureGap: 4, fillWeight: 1.2, hachureAngle: 10})});
  return <Ink marks={sk.marks} opacity={0.55} />;
};

export const TestFiguren: React.FC = () => {
  const f = useCurrentFrame();

  // ---------- Kenza ----------
  const kx = ip(f, [60, 100], [-150, 300], Easing.out(Easing.sin));
  const kWalking = f >= 60 && f < 100;
  let kTurn = 1;
  if (f >= 106) kTurn = turnCurve(f, 106, 7, 1);
  if (f >= 150) kTurn = turnCurve(f, 150, 7, -1);
  let kPose: Pose = 'phone';
  if (f >= 150) kPose = blendPose('phone', 'stand', ip(f, [150, 162], [0, 1]));
  if (f >= 196) kPose = blendPose('stand', 'handOut', ip(f, [196, 212], [0, 1], Easing.inOut(Easing.sin)));
  let kExpr: Expression = 'searching';
  let kLook = {x: 0.5, y: 0.85};
  if (f >= 100) kLook = {x: Math.sin((f - 100) / 7) * 0.8, y: -0.1};
  if (f >= 158) {
    kExpr = 'surprised';
    kLook = {x: 0.9, y: -0.4};
  }
  if (f >= 196) {
    kExpr = 'shy';
    kLook = {x: 0.4, y: 0.75};
  }
  if (f >= 258) {
    kExpr = 'bigSmile';
  }
  const kenza: KenzaProps = {
    x: kx,
    y: GROUND,
    scale: 1.2,
    turn: kTurn,
    pose: kPose,
    walkCycle: kWalking ? (kx + 150) / STRIDE : undefined,
    expression: kExpr,
    blink: Math.max(pulse(f, 163), pulse(f, 170), pulse(f, 232, 7)),
    look: kLook,
    holding: f < 156 ? 'phone' : undefined,
    phoneSpin: f * 14,
  };

  // ---------- Pablo ----------
  const px = ip(f, [120, 160], [1250, 800], Easing.out(Easing.sin));
  const pWalking = f >= 120 && f < 160;
  let pExpr: Expression = 'smile';
  if (f >= 168 && f < 200) pExpr = 'grin';
  const pablo: PabloProps = {
    x: px,
    y: GROUND,
    scale: 1.2,
    turn: -1,
    pose: f >= 182 ? blendPose('stand', 'reach', ip(f, [182, 196], [0, 1], Easing.inOut(Easing.sin))) : 'stand',
    walkCycle: pWalking ? (1250 - px) / STRIDE : undefined,
    expression: pExpr,
    blink: Math.max(pulse(f, 140), pulse(f, 214, 7), pulse(f, 262, 7)),
    look: pWalking ? {x: 0.5, y: 0} : {x: 1, y: 0.45},
  };

  // ---------- Faden, Herzen ----------
  const from = pabloHand(pablo);
  const to = kenzaHand(kenza);
  const threadP = ip(f, [198, 232], [0, 1], Easing.inOut(Easing.quad));
  const glow = f < 232 ? 0 : ip(f, [232, 244], [0, 1]) * (0.7 + 0.3 * Math.sin((f - 232) / 4));
  const midX = (from[0] + to[0]) / 2;
  const midY = (from[1] + to[1]) / 2 + 40;
  const hearts = [
    {s: 240, dx: -10, size: 22, c: C.rot},
    {s: 249, dx: 34, size: 16, c: C.rosa},
    {s: 257, dx: -40, size: 26, c: C.rot},
    {s: 266, dx: 18, size: 18, c: C.rosa},
    {s: 276, dx: -14, size: 24, c: C.rot},
  ];

  const qTop = kenzaHeadTop(kenza);

  // Schmetterling
  const bt = ip(f, [244, 300], [0, 1]);

  return (
    <AbsoluteFill>
      <svg viewBox={`0 0 ${S} ${S}`} width={S} height={S}>
        <PaperBase w={S} h={S} />
        <Vine spec={VINE} progress={ip(f, [0, 52], [0, 1], Easing.inOut(Easing.sin))} pen seed={51} />
        <Vine spec={SPRIG} progress={ip(f, [18, 54], [0, 1])} seed={61} />
        <Rose
          x={BUD.x}
          y={BUD.y}
          angle={BUD.angle}
          size={0.95}
          draw={ip(f, [50, 60], [0, 1])}
          open={ip(f, [252, 296], [0, 0.6], Easing.out(Easing.cubic))}
        />
        <Ground progress={ip(f, [6, 44], [0, 1])} />
        {f >= 60 ? <Shadow x={kx + 6} w={110} seed={71} /> : null}
        {f >= 120 ? <Shadow x={px - 6} w={150} seed={72} /> : null}
        {f >= 118 ? <Pablo {...pablo} /> : null}
        {f >= 58 ? <Kenza {...kenza} /> : null}
        <RedThread from={from} to={to} progress={threadP} glow={glow} sag={70} />
        {hearts.map((h, i) =>
          f >= h.s ? (
            <Heart
              key={i}
              x={midX + h.dx + Math.sin((f - h.s) / 6 + i) * 14}
              y={midY - ip(f, [h.s, h.s + 55], [0, 260], Easing.out(Easing.quad))}
              size={h.size}
              color={h.c}
              draw={ip(f, [h.s, h.s + 8], [0, 1])}
              opacity={ip(f, [h.s + 40, h.s + 58], [1, 0])}
              seed={80 + i}
            />
          ) : null,
        )}
        {f >= 98 && f < 160 ? (
          <QuestionMark
            x={qTop[0] + 70 * Math.sign(kTurn)}
            y={qTop[1] - 30 + Math.sin(f / 5) * 4}
            draw={ip(f, [98, 108], [0, 1])}
            opacity={ip(f, [150, 158], [1, 0])}
            seed={90}
          />
        ) : null}
        {f >= 158 && f < 200 ? (
          <Exclamation x={qTop[0] + 60} y={qTop[1] - 28} draw={ip(f, [158, 164], [0, 1])} opacity={ip(f, [190, 198], [1, 0])} seed={91} />
        ) : null}
        {f >= 244 ? (
          <Butterfly
            x={interpolate(bt, [0, 1], [-80, 1160])}
            y={360 - 120 * bt + Math.sin(bt * Math.PI * 3) * 45}
            flap={Math.abs(Math.sin(f * 0.8))}
            angle={12 * Math.cos(bt * Math.PI * 3)}
            size={1.05}
            draw={ip(f, [244, 250], [0, 1])}
          />
        ) : null}
        <PaperGrain w={S} h={S} />
      </svg>
    </AbsoluteFill>
  );
};
