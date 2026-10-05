import React from 'react';
import {useCurrentFrame} from 'remotion';
import {palette} from '../theme';
import {HoseLimb} from './HoseLimb';
import {Rough} from './Rough';

export type PabloPose = 'stand' | 'walk' | 'stroll' | 'tipHat' | 'lean' | 'reach' | 'offerHand' | 'hidden';
export type PabloExpression = 'smile' | 'grin' | 'surprised' | 'thoughtful' | 'sad' | 'talk';

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
  /** Hut abgenommen und an den Haken gehängt (Folge 23). */
  noHat?: boolean;
  handFront?: Pt;
  handBack?: Pt;
  id?: string;
};

export const PABLO_HEAD = {x: 0, y: -408};
export const PABLO_HEIGHT = 500;

const TAU = Math.PI * 2;
const deg = (d: number) => (d * Math.PI) / 180;
const BEARD = '#3B2A1E';

const Boot: React.FC<{at: Pt; tilt: number; salt: string}> = ({at, tilt, salt}) => (
  <g transform={`translate(${at.x},${at.y}) rotate(${tilt})`}>
    <Rough
      shape={{kind: 'path', d: 'M-12,-34 L-12,-8 C-14,6 -4,10 14,10 C32,10 34,0 28,-6 C22,-10 12,-10 10,-14 L10,-34 Z'}}
      salt={`${salt}-boot`}
      fill={palette.woodDark}
      wash={palette.woodDark}
      washOpacity={0.55}
      hachureGap={3.4}
      strokeWidth={2.4}
    />
    <Rough shape={{kind: 'line', x1: -12, y1: -26, x2: 10, y2: -27}} salt={`${salt}-cuff`} strokeWidth={2} />
  </g>
);

const Hand: React.FC<{at: Pt; salt: string}> = ({at, salt}) => (
  <g transform={`translate(${at.x},${at.y})`}>
    <Rough shape={{kind: 'circle', cx: 0, cy: 0, d: 24}} salt={`${salt}-hand`} fill={palette.skinPablo} fillStyle="solid" strokeWidth={2.4} />
    <Rough shape={{kind: 'path', d: 'M-7,-7 Q-14,-14 -7,-16'}} salt={`${salt}-thumb`} strokeWidth={2} />
  </g>
);

const Hat: React.FC<{id: string}> = ({id}) => (
  <g>
    {/* Krone */}
    <Rough
      shape={{kind: 'path', d: 'M-44,-34 C-46,-70 -30,-92 0,-92 C30,-92 46,-70 44,-34 Z'}}
      salt={`${id}-crown`}
      fill={palette.wood}
      wash={palette.wood}
      washOpacity={0.6}
      hachureGap={4}
      strokeWidth={2.8}
    />
    <Rough shape={{kind: 'path', d: 'M-16,-90 Q0,-76 16,-90'}} salt={`${id}-dent`} strokeWidth={2.2} />
    {/* Hutband */}
    <Rough shape={{kind: 'path', d: 'M-45,-44 Q0,-36 45,-44 L44,-34 Q0,-26 -44,-34 Z'}} salt={`${id}-band`} fill={palette.rosenrot} fillStyle="solid" strokeWidth={2} />
    {/* breite Krempe */}
    <Rough
      shape={{kind: 'ellipse', cx: 0, cy: -32, w: 190, h: 34}}
      salt={`${id}-brim`}
      fill={palette.wood}
      wash={palette.wood}
      washOpacity={0.65}
      hachureGap={4}
      hachureAngle={10}
      strokeWidth={2.8}
    />
    {/* kleine Feder */}
    <Rough shape={{kind: 'path', d: 'M30,-44 C44,-70 62,-74 58,-58 C54,-48 42,-44 30,-44 Z'}} salt={`${id}-feather`} fill={palette.senf} hachureGap={3} strokeWidth={1.8} />
  </g>
);

const Head: React.FC<{
  expression: PabloExpression;
  blink: number;
  look: Pt;
  talk: number;
  noHat: boolean;
  hatTip: number;
  id: string;
}> = ({expression, blink, look, talk, noHat, hatTip, id}) => {
  const frame = useCurrentFrame();
  const s = (n: string) => `${id}-head-${n}`;
  const surprised = expression === 'surprised';
  const brow = surprised ? -10 : expression === 'thoughtful' ? 4 : expression === 'sad' ? 2 : 0;
  const eyeH = (surprised ? 34 : 28) * Math.max(0.1, 1 - blink);
  const grassWiggle = Math.sin(frame * 0.25) * 6;
  const open = expression === 'talk' ? talk : expression === 'surprised' ? 0.8 : 0;

  return (
    <g>
      {/* Haar am Hinterkopf */}
      <Rough
        shape={{kind: 'path', d: 'M-54,-10 C-62,-50 -40,-70 0,-70 C40,-70 62,-50 54,-10 C48,-30 30,-44 0,-44 C-30,-44 -48,-30 -54,-10 Z'}}
        salt={s('hair')}
        fill={BEARD}
        fillStyle="cross-hatch"
        hachureGap={3.6}
        strokeWidth={2.4}
      />
      {/* Ohren */}
      {[-1, 1].map((side) => (
        <Rough key={side} shape={{kind: 'ellipse', cx: side * 54, cy: 4, w: 16, h: 24}} salt={s(`ear${side}`)} fill={palette.skinPablo} fillStyle="solid" strokeWidth={2.2} />
      ))}
      {/* Gesicht (länglicher als Karimas) */}
      <Rough
        shape={{kind: 'path', d: 'M-52,-16 C-56,40 -32,70 0,70 C32,70 56,40 52,-16 C48,-46 28,-58 0,-58 C-28,-58 -48,-46 -52,-16 Z'}}
        salt={s('face')}
        fill={palette.skinPablo}
        fillStyle="solid"
        strokeWidth={2.8}
      />
      {/* Vollbart — Kritzelschraffur */}
      <Rough
        shape={{kind: 'path', d: 'M-54,-4 C-58,46 -36,92 0,96 C36,92 58,46 54,-4 C46,14 36,24 20,24 C12,18 -12,18 -20,24 C-36,24 -46,14 -54,-4 Z'}}
        salt={s('beard')}
        fill={BEARD}
        fillStyle="cross-hatch"
        hachureGap={3.4}
        fillWeight={1.4}
        strokeWidth={2.6}
      />
      {/* Schnurrbart */}
      <Rough shape={{kind: 'path', d: 'M-28,26 C-18,16 -6,18 0,22 C6,18 18,16 28,26 C18,30 6,28 0,26 C-6,28 -18,30 -28,26 Z'}} salt={s('mustache')} fill={BEARD} fillStyle="solid" strokeWidth={2.2} />
      {/* Mund im Bart */}
      {open > 0.05 ? (
        <Rough shape={{kind: 'ellipse', cx: 0, cy: 40, w: 22, h: 6 + open * 16}} salt={s('mouthO')} fill={palette.rosenrot} wash={palette.ink} washOpacity={0.5} hachureGap={3} strokeWidth={2.4} />
      ) : expression === 'sad' || expression === 'thoughtful' ? (
        <Rough shape={{kind: 'path', d: 'M-14,42 Q0,36 14,42'}} salt={s('mouthS')} stroke={palette.white} strokeWidth={2.6} />
      ) : (
        <Rough shape={{kind: 'path', d: `M-20,36 Q0,${expression === 'grin' ? 56 : 50} 20,36`}} salt={s('mouth')} stroke={palette.white} strokeWidth={3} />
      )}
      {/* Grashalm im Mundwinkel */}
      {open < 0.3 ? (
        <g transform={`translate(18,40) rotate(${-24 + grassWiggle})`}>
          <Rough shape={{kind: 'path', d: 'M0,0 C16,-6 34,-14 52,-30'}} salt={s('grass')} stroke={palette.salbei} strokeWidth={3} multiStroke={false} />
          <Rough shape={{kind: 'path', d: 'M46,-26 L58,-38 M50,-24 L62,-30'}} salt={s('grass-seed')} stroke={palette.senf} strokeWidth={2.4} />
        </g>
      ) : null}
      {/* Nase */}
      <Rough shape={{kind: 'path', d: 'M-4,0 C-12,14 -8,22 4,20 C12,18 10,10 6,4'}} salt={s('nose')} fill={palette.rosa} fillStyle="solid" strokeWidth={2.4} />
      {/* Augen */}
      {[-22, 22].map((x, i) =>
        blink > 0.85 ? (
          <Rough key={i} shape={{kind: 'path', d: `M${x - 11},-6 Q${x},4 ${x + 11},-6`}} salt={s(`lid${i}`)} strokeWidth={3} />
        ) : (
          <g key={i}>
            <Rough shape={{kind: 'ellipse', cx: x, cy: -8, w: 24, h: eyeH}} salt={s(`eye${i}`)} fill={palette.white} fillStyle="solid" strokeWidth={2.4} />
            <ellipse cx={x + look.x * 5} cy={-6 + look.y * Math.max(0, eyeH / 2 - 8)} rx={5.5} ry={Math.min(8, eyeH * 0.32)} fill={palette.ink} />
            <circle cx={x + look.x * 5 - 2} cy={-9 + look.y * Math.max(0, eyeH / 2 - 8)} r={1.8} fill={palette.white} />
          </g>
        ),
      )}
      {/* buschige Brauen */}
      <Rough shape={{kind: 'path', d: `M-36,${-28 + brow} Q-22,${-38 + brow} -8,${-30 + brow}`}} salt={s('browL')} strokeWidth={4.5} />
      <Rough shape={{kind: 'path', d: `M8,${-30 + brow} Q22,${-38 + brow} 36,${-28 + brow}`}} salt={s('browR')} strokeWidth={4.5} />
      {/* Hut */}
      {!noHat ? (
        <g transform={`translate(${hatTip * 10},${-hatTip * 34}) rotate(${-hatTip * 14})`}>
          <Hat id={s('hat')} />
        </g>
      ) : null}
    </g>
  );
};

/**
 * PABLO — freier Wanderer: groß, Vollbart (Kritzelschraffur), Hut mit breiter Krempe,
 * langer Wandermantel, Stiefel, Wanderstock, Bündel über der Schulter, Grashalm im Mund.
 * Ursprung (0,0) = Mitte zwischen den Füßen.
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
  const sway = walking ? Math.sin(ph) * (lazy ? 6 : 3) : 0;
  const shakeX = shake * 14;

  const hipY = -150;
  const legLen = 140;
  const hipL: Pt = {x: -18, y: hipY};
  const hipR: Pt = {x: 18, y: hipY};
  const swing = walking ? (lazy ? 20 : 26) : 0;
  const aL = Math.sin(ph) * swing;
  const aR = -Math.sin(ph) * swing;
  const liftL = walking ? Math.max(0, Math.cos(ph)) * 24 : 0;
  const liftR = walking ? Math.max(0, -Math.cos(ph)) * 24 : 0;
  const legPose = (hip: Pt, angle: number, lift: number): Pt => ({
    x: hip.x + Math.sin(deg(angle)) * legLen,
    y: hip.y + Math.cos(deg(angle)) * legLen - lift,
  });
  const footL = walking ? legPose(hipL, aL, liftL) : {x: -26, y: -8};
  const footR = walking ? legPose(hipR, aR, liftR) : {x: 26, y: -8};

  const sY = -318;
  const sB: Pt = {x: -36, y: sY};
  const sF: Pt = {x: 36, y: sY};

  // Hinterer Arm hält das Bündel über der Schulter, vorderer den Wanderstock
  let hB: Pt = {x: -18, y: -350};
  let bB = -30;
  let hF: Pt = {x: 66, y: -214};
  let bF = -16;
  let hatTip = 0;
  if (walking) {
    const arm = Math.sin(ph) * 20;
    hF = {x: 62 + arm, y: -212};
  }
  if (pose === 'tipHat') {
    hF = {x: 16, y: -466};
    bF = 40;
    hatTip = 1;
  } else if (pose === 'reach' || pose === 'offerHand') {
    hF = {x: 120, y: pose === 'reach' ? -300 : -250};
    bF = 18;
  } else if (pose === 'lean') {
    hF = {x: 70, y: -250};
  }
  if (!withBundle && !hbOverride) {
    hB = {x: -56, y: -170};
    bB = 12;
  }
  if (hbOverride) hB = hbOverride;
  if (hfOverride) hF = hfOverride;

  const stickTop = {x: hF.x + 2, y: hF.y - 46};
  const stickBottom = walking ? {x: hF.x + 6 + Math.sin(ph) * 14, y: -4 - bob} : {x: hF.x + 8, y: -4};
  const showStick = withStick && pose !== 'tipHat' && pose !== 'reach' && pose !== 'offerHand';
  const k = (n: string) => `${id}-${n}`;
  const coatFlap = walking ? Math.sin(ph * 2) * 6 : 0;

  if (pose === 'hidden') return null;

  return (
    <g transform={`scale(${facing},1)`}>
      <ellipse cx={0} cy={2} rx={70 + bob * 0.6} ry={10} fill={palette.ink} opacity={0.14} />
      <g transform={`translate(${sway + shakeX},${bob}) rotate(${shake * 4},0,-200)`}>
        {/* Bündel am Stock über der Schulter (hinter dem Körper) */}
        {withBundle ? (
          <g>
            <Rough shape={{kind: 'line', x1: hB.x + 30, y1: hB.y + 18, x2: hB.x - 96, y2: hB.y - 40}} salt={k('bstick')} stroke={palette.woodDark} strokeWidth={5} />
            <Rough
              shape={{kind: 'path', d: `M${hB.x - 92},${hB.y - 46} C${hB.x - 140},${hB.y - 40} ${hB.x - 136},${hB.y + 30} ${hB.x - 92},${hB.y + 26} C${hB.x - 56},${hB.y + 22} ${hB.x - 62},${hB.y - 40} ${hB.x - 92},${hB.y - 46} Z`}}
              salt={k('bundle')}
              fill={palette.rosenrot}
              wash={palette.rosenrot}
              washOpacity={0.4}
              hachureGap={5}
              strokeWidth={2.6}
            />
            {/* Punkte auf dem Bündeltuch */}
            {[
              [-108, -16],
              [-92, 4],
              [-80, -26],
            ].map(([dx, dy], i) => (
              <circle key={i} cx={hB.x + dx} cy={hB.y + dy} r={3.5} fill={palette.white} />
            ))}
            <Rough shape={{kind: 'path', d: `M${hB.x - 94},${hB.y - 48} l-8,-14 m8,14 l10,-12`}} salt={k('knot')} strokeWidth={2.2} />
          </g>
        ) : null}

        <HoseLimb from={hipL} to={{x: footL.x, y: footL.y - bob + 4}} bend={walking ? -8 - liftL * 0.8 : -4} thickness={15} color={'#4A3A2E'} salt={k('legL')} />
        <HoseLimb from={hipR} to={{x: footR.x, y: footR.y - bob + 4}} bend={walking ? -8 - liftR * 0.8 : 4} thickness={15} color={'#4A3A2E'} salt={k('legR')} />
        <Boot at={{x: footL.x, y: footL.y - bob}} tilt={walking ? aL * 0.5 : 0} salt={k('bootL')} />
        <Boot at={{x: footR.x, y: footR.y - bob}} tilt={walking ? aR * 0.5 : 0} salt={k('bootR')} />

        <HoseLimb from={sB} to={hB} bend={bB} thickness={15} color={palette.coat} salt={k('armB')} />
        <Hand at={hB} salt={k('handB')} />

        {/* Langer Wandermantel */}
        <Rough
          shape={{kind: 'path', d: `M-40,-326 C-56,-260 -66,-180 ${-74 - coatFlap},-104 Q-40,-96 -10,-104 L-6,-250 L6,-250 L10,-104 Q40,-96 ${74 + coatFlap},-104 C66,-180 56,-260 40,-326 Q0,-340 -40,-326 Z`}}
          salt={k('coat')}
          fill={palette.coat}
          wash={palette.coat}
          washOpacity={0.55}
          hachureGap={5.5}
          hachureAngle={-55}
          strokeWidth={2.9}
        />
        {/* Hemd im Mantelausschnitt */}
        <Rough shape={{kind: 'path', d: 'M-16,-330 L0,-280 L16,-330 Z'}} salt={k('shirt')} fill={palette.senf} wash={palette.senf} washOpacity={0.5} hachureGap={3} strokeWidth={2.2} />
        {/* Revers + Knöpfe + Taschen */}
        <Rough shape={{kind: 'path', d: 'M-34,-326 L-8,-262 M34,-326 L8,-262'}} salt={k('lapel')} strokeWidth={2.4} />
        {[-236, -200, -164].map((y, i) => (
          <circle key={i} cx={-14} cy={y} r={4} fill={palette.ink} />
        ))}
        <Rough shape={{kind: 'path', d: 'M-56,-170 L-28,-172 M30,-172 L58,-170'}} salt={k('pockets')} strokeWidth={2.2} />
        {/* Gürtel */}
        <Rough shape={{kind: 'path', d: 'M-50,-218 Q0,-208 50,-218'}} salt={k('belt')} stroke={palette.woodDark} strokeWidth={5} />

        {showStick ? (
          <Rough shape={{kind: 'line', x1: stickTop.x, y1: stickTop.y, x2: stickBottom.x, y2: stickBottom.y}} salt={k('stick')} stroke={palette.woodDark} strokeWidth={6} />
        ) : null}
        <HoseLimb from={sF} to={hF} bend={bF} thickness={15} color={palette.coat} salt={k('armF')} />
        <Hand at={hF} salt={k('handF')} />

        <g transform={`translate(${PABLO_HEAD.x},${PABLO_HEAD.y}) rotate(${headTilt + sway * 0.5})`}>
          <Head expression={expression} blink={blink} look={{x: lookX, y: lookY}} talk={talk} noHat={noHat} hatTip={hatTip} id={id} />
        </g>
      </g>
    </g>
  );
};
