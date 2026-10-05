import React from 'react';
import {useCurrentFrame} from 'remotion';
import {palette} from '../theme';
import {HoseLimb} from './HoseLimb';
import {Rough} from './Rough';

export type PabloPose = 'stand' | 'walk' | 'stroll' | 'tipHat' | 'lean' | 'reach' | 'offerHand' | 'hipHand' | 'hidden';
export type PabloExpression = 'smile' | 'grin' | 'smirk' | 'wink' | 'surprised' | 'thoughtful' | 'sad' | 'talk';

type Pt = {x: number; y: number};

export type PabloProps = {
  pose?: PabloPose;
  expression?: PabloExpression;
  blink?: number;
  walkCycle?: number;
  facing?: 1 | -1;
  lookX?: number;
  lookY?: number;
  headTilt?: number;
  /** 0..1 Mund offen beim Sprechen. */
  talk?: number;
  /** -1..1 Körper schüttelt sich (z. B. Seil abschütteln). */
  shake?: number;
  withBundle?: boolean;
  withStick?: boolean;
  /** Hut abgenommen (Folge 23). */
  noHat?: boolean;
  handFront?: Pt;
  handBack?: Pt;
  id?: string;
};

export const PABLO_HEAD = {x: 0, y: -512};
export const PABLO_HEIGHT = 600;

const TAU = Math.PI * 2;
const deg = (d: number) => (d * Math.PI) / 180;
const HAIR = '#2B1E16';

const Boot: React.FC<{at: Pt; tilt: number; salt: string}> = ({at, tilt, salt}) => (
  <g transform={`translate(${at.x},${at.y}) rotate(${tilt})`}>
    <Rough
      shape={{kind: 'path', d: 'M-13,-52 L-13,-8 C-15,6 -4,10 16,10 C34,10 36,0 30,-6 C24,-10 14,-10 12,-14 L12,-52 Z'}}
      salt={`${salt}-boot`}
      fill={palette.woodDark}
      wash={palette.woodDark}
      washOpacity={0.6}
      hachureGap={3.4}
      strokeWidth={2.4}
    />
    <Rough shape={{kind: 'path', d: 'M-15,-52 L14,-52 L14,-44 L-15,-44 Z'}} salt={`${salt}-cuff`} fill={palette.wood} fillStyle="solid" strokeWidth={2} />
  </g>
);

const Hand: React.FC<{at: Pt; salt: string}> = ({at, salt}) => (
  <g transform={`translate(${at.x},${at.y})`}>
    <Rough shape={{kind: 'ellipse', cx: 0, cy: 0, w: 24, h: 26}} salt={`${salt}-hand`} fill={palette.skinPablo} fillStyle="solid" strokeWidth={2.4} />
    <Rough shape={{kind: 'path', d: 'M-7,-7 Q-14,-14 -7,-16'}} salt={`${salt}-thumb`} strokeWidth={2} />
  </g>
);

const Hat: React.FC<{id: string}> = ({id}) => (
  <g>
    <Rough
      shape={{kind: 'path', d: 'M-40,-30 C-42,-66 -26,-84 0,-84 C26,-84 42,-66 40,-30 Z'}}
      salt={`${id}-crown`}
      fill={palette.woodDark}
      wash={palette.woodDark}
      washOpacity={0.6}
      hachureGap={4}
      strokeWidth={2.8}
    />
    <Rough shape={{kind: 'path', d: 'M-14,-82 Q0,-70 14,-82'}} salt={`${id}-dent`} strokeWidth={2.2} />
    <Rough shape={{kind: 'path', d: 'M-41,-40 Q0,-32 41,-40 L40,-30 Q0,-22 -40,-30 Z'}} salt={`${id}-band`} fill={palette.rosenrot} fillStyle="solid" strokeWidth={2} />
    {/* breite, leicht geschwungene Krempe */}
    <Rough
      shape={{kind: 'path', d: 'M-100,-24 C-80,-40 -40,-36 0,-34 C40,-36 80,-40 104,-30 C90,-14 40,-16 0,-16 C-40,-16 -86,-10 -100,-24 Z'}}
      salt={`${id}-brim`}
      fill={palette.woodDark}
      wash={palette.woodDark}
      washOpacity={0.65}
      hachureGap={4}
      hachureAngle={10}
      strokeWidth={2.8}
    />
    <Rough shape={{kind: 'path', d: 'M28,-40 C42,-66 60,-70 56,-54 C52,-44 40,-40 28,-40 Z'}} salt={`${id}-feather`} fill={palette.senf} hachureGap={3} strokeWidth={1.8} />
  </g>
);

const Head: React.FC<{expression: PabloExpression; blink: number; look: Pt; talk: number; noHat: boolean; hatTip: number; id: string}> = ({
  expression,
  blink,
  look,
  talk,
  noHat,
  hatTip,
  id,
}) => {
  const frame = useCurrentFrame();
  const s = (n: string) => `${id}-head-${n}`;
  const surprised = expression === 'surprised';
  const smirk = expression === 'smirk' || expression === 'wink' || expression === 'grin';
  const eyeH = (surprised ? 26 : 18) * Math.max(0.1, 1 - blink);
  const grassWiggle = Math.sin(frame * 0.25) * 6;
  const open = expression === 'talk' ? talk : surprised ? 0.7 : 0;
  const brow = surprised ? -8 : expression === 'thoughtful' || expression === 'sad' ? 3 : 0;

  // zerzauste Locken
  const curls: [number, number, number][] = [
    [-44, -30, 18],
    [-50, -8, 16],
    [-46, 14, 14],
    [44, -30, 18],
    [50, -8, 16],
    [-20, -46, 18],
    [6, -50, 18],
    [30, -44, 16],
  ];

  return (
    <g>
      {curls.map(([cx, cy, d], i) => (
        <Rough key={i} shape={{kind: 'circle', cx, cy, d}} salt={s(`curl${i}`)} fill={HAIR} fillStyle="cross-hatch" hachureGap={3} strokeWidth={2} />
      ))}
      {[-1, 1].map((side) => (
        <Rough key={side} shape={{kind: 'ellipse', cx: side * 44, cy: 6, w: 14, h: 22}} salt={s(`ear${side}`)} fill={palette.skinPablo} fillStyle="solid" strokeWidth={2.2} />
      ))}
      {/* kantiges Gesicht, kräftiger Kiefer */}
      <Rough
        shape={{kind: 'path', d: 'M-42,-24 C-44,10 -40,40 -24,58 L-10,66 L10,66 L24,58 C40,40 44,10 42,-24 C40,-44 24,-52 0,-52 C-24,-52 -40,-44 -42,-24 Z'}}
        salt={s('face')}
        fill={palette.skinPablo}
        fillStyle="solid"
        strokeWidth={2.8}
      />
      {/* dunkler, gepflegter Vollbart */}
      <Rough
        shape={{kind: 'path', d: 'M-43,-2 C-44,30 -30,60 0,66 C30,60 44,30 43,-2 C38,14 30,24 18,26 C10,20 -10,20 -18,26 C-30,24 -38,14 -43,-2 Z'}}
        salt={s('beard')}
        fill={HAIR}
        fillStyle="cross-hatch"
        hachureGap={2.8}
        fillWeight={1.4}
        strokeWidth={2.4}
      />
      <Rough shape={{kind: 'path', d: 'M-24,24 C-14,14 -4,16 0,20 C4,16 14,14 24,24 C14,28 4,26 0,24 C-4,26 -14,28 -24,24 Z'}} salt={s('mustache')} fill={HAIR} fillStyle="solid" strokeWidth={2} />
      {open > 0.05 ? (
        <Rough shape={{kind: 'ellipse', cx: 0, cy: 38, w: 20, h: 6 + open * 14}} salt={s('mouthO')} fill={palette.rosenrot} wash={palette.ink} washOpacity={0.5} hachureGap={3} strokeWidth={2.2} />
      ) : expression === 'sad' || expression === 'thoughtful' ? (
        <Rough shape={{kind: 'path', d: 'M-12,40 Q0,35 12,40'}} salt={s('mouthS')} stroke={palette.white} strokeWidth={2.4} />
      ) : smirk ? (
        // verwegenes, schiefes Grinsen mit Zähnen
        <Rough shape={{kind: 'path', d: 'M-16,34 C-6,44 10,46 22,30 C10,36 -4,38 -16,34 Z'}} salt={s('mouthG')} fill={palette.white} fillStyle="solid" strokeWidth={2.2} />
      ) : (
        <Rough shape={{kind: 'path', d: 'M-16,34 Q0,48 16,34'}} salt={s('mouth')} stroke={palette.white} strokeWidth={2.8} />
      )}
      {open < 0.3 ? (
        <g transform={`translate(${smirk ? 20 : 14},38) rotate(${-24 + grassWiggle})`}>
          <Rough shape={{kind: 'path', d: 'M0,0 C16,-6 34,-14 52,-30'}} salt={s('grass')} stroke={palette.salbei} strokeWidth={3} multiStroke={false} />
          <Rough shape={{kind: 'path', d: 'M46,-26 L58,-38 M50,-24 L62,-30'}} salt={s('grass-seed')} stroke={palette.senf} strokeWidth={2.4} />
        </g>
      ) : null}
      {/* gerade Nase */}
      <Rough shape={{kind: 'path', d: 'M-2,-10 L-6,10 Q0,14 6,10'}} salt={s('nose')} strokeWidth={2.2} />
      {/* Augen: selbstbewusst, leicht verengt */}
      {[-18, 18].map((x, i) =>
        blink > 0.85 || (expression === 'wink' && i === 1) ? (
          <Rough key={i} shape={{kind: 'path', d: `M${x - 10},-12 Q${x},-4 ${x + 10},-12`}} salt={s(`lid${i}`)} strokeWidth={3} />
        ) : (
          <g key={i}>
            <Rough shape={{kind: 'ellipse', cx: x, cy: -12, w: 22, h: eyeH}} salt={s(`eye${i}`)} fill={palette.white} fillStyle="solid" strokeWidth={2.4} />
            <ellipse cx={x + look.x * 5} cy={-11 + look.y * Math.max(0, eyeH / 2 - 7)} rx={5} ry={Math.min(7, eyeH * 0.38)} fill={palette.ink} />
            <circle cx={x + look.x * 5 - 2} cy={-14 + look.y * Math.max(0, eyeH / 2 - 7)} r={1.6} fill={palette.white} />
            {!surprised ? <path d={`M${x - 11},${-14 - eyeH / 2 + 4} Q${x},${-18 - eyeH / 2 + 4} ${x + 11},${-14 - eyeH / 2 + 4}`} stroke={palette.ink} strokeWidth={2.6} fill="none" /> : null}
          </g>
        ),
      )}
      {/* kräftige Brauen; bei smirk eine hochgezogen */}
      <Rough shape={{kind: 'path', d: `M-32,${-30 + brow} Q-20,${-38 + brow} -6,${-32 + brow}`}} salt={s('browL')} strokeWidth={4.6} />
      <Rough shape={{kind: 'path', d: `M6,${-32 + brow - (smirk ? 6 : 0)} Q20,${-40 + brow - (smirk ? 8 : 0)} 32,${-30 + brow - (smirk ? 4 : 0)}`}} salt={s('browR')} strokeWidth={4.6} />
      {!noHat ? (
        <g transform={`translate(${hatTip * 12},${-hatTip * 36}) rotate(${-8 - hatTip * 16})`}>
          <Hat id={s('hat')} />
        </g>
      ) : null}
    </g>
  );
};

/**
 * PABLO — junger, wilder Wanderer: groß, breite Schultern, dunkler Vollbart (Kritzelschraffur),
 * zerzauste Locken, Hut mit breiter Krempe, offenes Hemd, langer Wandermantel, Stiefel,
 * Wanderstock, Bündel über der Schulter, Grashalm im Mund. Ursprung (0,0) = Mitte zwischen den Füßen.
 */
export const Pablo: React.FC<PabloProps> = ({
  pose = 'stand',
  expression = 'smile',
  blink = 0,
  walkCycle = 0,
  facing = 1,
  lookX = 0.3,
  lookY = 0,
  headTilt = 0,
  talk = 0,
  shake = 0,
  withBundle = true,
  withStick = true,
  noHat = false,
  handFront: hfOverride,
  handBack: hbOverride,
  id = 'pablo',
}) => {
  const walking = pose === 'walk' || pose === 'stroll';
  const ph = walkCycle * TAU;
  const lazy = pose === 'stroll';
  const bob = walking ? -Math.abs(Math.sin(ph)) * (lazy ? 12 : 18) : 0;
  const sway = walking ? Math.sin(ph) * (lazy ? 8 : 4) : 0;
  const shakeX = shake * 16;

  const hipY = -282;
  const legLen = 272;
  const hipL: Pt = {x: -20, y: hipY};
  const hipR: Pt = {x: 20, y: hipY};
  const swing = walking ? (lazy ? 18 : 24) : 0;
  const aL = Math.sin(ph) * swing;
  const aR = -Math.sin(ph) * swing;
  const liftL = walking ? Math.max(0, Math.cos(ph)) * 28 : 0;
  const liftR = walking ? Math.max(0, -Math.cos(ph)) * 28 : 0;
  const legPose = (hip: Pt, angle: number, lift: number): Pt => ({
    x: hip.x + Math.sin(deg(angle)) * legLen,
    y: hip.y + Math.cos(deg(angle)) * legLen - lift,
  });
  // lässiger Stand: Gewicht auf einem Bein
  const footL = walking ? legPose(hipL, aL, liftL) : {x: -40, y: -6};
  const footR = walking ? legPose(hipR, aR, liftR) : {x: 30, y: -8};

  const sY = -440;
  const sB: Pt = {x: -62, y: sY};
  const sF: Pt = {x: 62, y: sY};

  let hB: Pt = {x: -36, y: -470};
  let bB = -36;
  let hF: Pt = {x: 92, y: -300};
  let bF = -18;
  let hatTip = 0;
  if (walking) {
    const arm = Math.sin(ph) * 24;
    hF = {x: 88 + arm, y: -300};
  }
  if (pose === 'tipHat') {
    hF = {x: 24, y: -598};
    bF = 46;
    hatTip = 1;
  } else if (pose === 'reach' || pose === 'offerHand') {
    hF = {x: 170, y: pose === 'reach' ? -430 : -360};
    bF = 20;
  } else if (pose === 'lean') {
    hF = {x: 100, y: -340};
  } else if (pose === 'hipHand') {
    hF = {x: 46, y: -300};
    bF = 34;
  }
  if (!withBundle && !hbOverride) {
    hB = {x: -82, y: -290};
    bB = 16;
  }
  if (hbOverride) hB = hbOverride;
  if (hfOverride) hF = hfOverride;

  const stickTop = {x: hF.x + 2, y: hF.y - 60};
  const stickBottom = walking ? {x: hF.x + 8 + Math.sin(ph) * 16, y: -4 - bob} : {x: hF.x + 10, y: -4};
  const showStick = withStick && !['tipHat', 'reach', 'offerHand', 'hipHand'].includes(pose);
  const k = (n: string) => `${id}-${n}`;
  const flap = walking ? Math.sin(ph * 2) * 10 + 8 : 0;

  if (pose === 'hidden') return null;

  return (
    <g transform={`scale(${facing},1)`}>
      <ellipse cx={0} cy={2} rx={76 + bob * 0.6} ry={10} fill={palette.ink} opacity={0.14} />
      <g transform={`translate(${sway + shakeX},${bob}) rotate(${shake * 4},0,-300)`}>
        {withBundle ? (
          <g>
            <Rough shape={{kind: 'line', x1: hB.x + 30, y1: hB.y + 18, x2: hB.x - 110, y2: hB.y - 44}} salt={k('bstick')} stroke={palette.woodDark} strokeWidth={5} />
            <Rough
              shape={{kind: 'path', d: `M${hB.x - 104},${hB.y - 50} C${hB.x - 154},${hB.y - 44} ${hB.x - 150},${hB.y + 30} ${hB.x - 104},${hB.y + 26} C${hB.x - 66},${hB.y + 22} ${hB.x - 72},${hB.y - 44} ${hB.x - 104},${hB.y - 50} Z`}}
              salt={k('bundle')}
              fill={palette.rosenrot}
              wash={palette.rosenrot}
              washOpacity={0.4}
              hachureGap={5}
              strokeWidth={2.6}
            />
            {[
              [-120, -16],
              [-104, 4],
              [-90, -28],
            ].map(([dx, dy], i) => (
              <circle key={i} cx={hB.x + dx} cy={hB.y + dy} r={3.5} fill={palette.white} />
            ))}
          </g>
        ) : null}

        {/* Mantel hinten (flattert) */}
        <Rough
          shape={{kind: 'path', d: `M-62,-440 C-74,-360 ${-88 - flap},-240 ${-98 - flap * 1.6},-150 Q-60,-140 -30,-160 L30,-160 Q60,-140 ${98 + flap * 0.6},-150 C88,-240 74,-360 62,-440 Z`}}
          salt={k('coatback')}
          base={palette.paper}
          fill={palette.coat}
          wash={palette.woodDark}
          washOpacity={0.45}
          hachureGap={6}
          hachureAngle={-55}
          strokeWidth={2.6}
        />
        <HoseLimb from={hipL} to={{x: footL.x, y: footL.y - bob + 4}} bend={walking ? -8 - liftL * 0.8 : -6} thickness={17} color={'#3E3128'} salt={k('legL')} />
        <HoseLimb from={hipR} to={{x: footR.x, y: footR.y - bob + 4}} bend={walking ? -8 - liftR * 0.8 : 6} thickness={17} color={'#3E3128'} salt={k('legR')} />
        <Boot at={{x: footL.x, y: footL.y - bob}} tilt={walking ? aL * 0.5 : 0} salt={k('bootL')} />
        <Boot at={{x: footR.x, y: footR.y - bob}} tilt={walking ? aR * 0.5 : 0} salt={k('bootR')} />

        <HoseLimb from={sB} to={hB} bend={bB} thickness={18} color={palette.coat} salt={k('armB')} />
        <Hand at={hB} salt={k('handB')} />

        {/* Oberkörper: V-Form, offenes Hemd */}
        <Rough
          shape={{kind: 'path', d: 'M-64,-444 C-60,-400 -40,-330 -32,-290 L32,-290 C40,-330 60,-400 64,-444 Q0,-462 -64,-444 Z'}}
          salt={k('shirt')}
          fill={palette.white}
          fillStyle="solid"
          strokeWidth={2.6}
        />
        <Rough shape={{kind: 'path', d: 'M-20,-450 L0,-392 L20,-450'}} salt={k('collar')} strokeWidth={2.4} />
        <Rough shape={{kind: 'path', d: 'M-10,-430 l6,8 m4,-10 l6,8 m-14,6 l6,8'}} salt={k('chest')} stroke={palette.inkSoft} strokeWidth={1.4} />
        {/* Gürtel mit Schnalle */}
        <Rough shape={{kind: 'path', d: 'M-34,-296 Q0,-288 34,-296 L34,-282 Q0,-274 -34,-282 Z'}} salt={k('belt')} fill={palette.woodDark} fillStyle="solid" strokeWidth={2} />
        <Rough shape={{kind: 'rect', x: -8, y: -294, w: 16, h: 14}} salt={k('buckle')} stroke={palette.senf} strokeWidth={2.6} />
        {/* Mantel vorn: offene Revers bis zum Knie */}
        <Rough
          shape={{kind: 'path', d: `M-64,-444 C-70,-380 -76,-260 ${-84 - flap * 0.6},-150 Q-62,-144 -44,-152 C-42,-260 -40,-360 -26,-440 Z`}}
          salt={k('coatL')}
          base={palette.paper}
          fill={palette.coat}
          wash={palette.coat}
          washOpacity={0.6}
          hachureGap={5}
          hachureAngle={-55}
          strokeWidth={2.8}
        />
        <Rough
          shape={{kind: 'path', d: `M64,-444 C70,-380 76,-260 ${84 + flap * 0.6},-150 Q62,-144 44,-152 C42,-260 40,-360 26,-440 Z`}}
          salt={k('coatR')}
          base={palette.paper}
          fill={palette.coat}
          wash={palette.coat}
          washOpacity={0.6}
          hachureGap={5}
          hachureAngle={-55}
          strokeWidth={2.8}
        />
        <Rough shape={{kind: 'path', d: 'M-26,-440 L-44,-380 L-36,-370 M26,-440 L44,-380 L36,-370'}} salt={k('lapel')} strokeWidth={2.2} />

        {/* Hals + Kopf */}
        <Rough shape={{kind: 'path', d: 'M-14,-450 L-14,-470 M14,-450 L14,-470'}} salt={k('neck')} strokeWidth={2.4} />
        <g transform={`translate(${PABLO_HEAD.x},${PABLO_HEAD.y}) rotate(${headTilt + sway * 0.4})`}>
          <Head expression={expression} blink={blink} look={{x: lookX, y: lookY}} talk={talk} noHat={noHat} hatTip={hatTip} id={id} />
        </g>

        {showStick ? (
          <Rough shape={{kind: 'line', x1: stickTop.x, y1: stickTop.y, x2: stickBottom.x, y2: stickBottom.y}} salt={k('stick')} stroke={palette.woodDark} strokeWidth={6} />
        ) : null}
        <HoseLimb from={sF} to={hF} bend={bF} thickness={18} color={palette.coat} salt={k('armF')} />
        <Hand at={hF} salt={k('handF')} />
      </g>
    </g>
  );
};
