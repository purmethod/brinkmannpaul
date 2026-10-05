import React from 'react';
import {palette} from '../theme';
import {HoseLimb} from './HoseLimb';
import {Rough} from './Rough';
import {Suitcase} from './Suitcase';

export type KarimaPose = 'stand' | 'walk' | 'hop' | 'wonder' | 'reach' | 'shush' | 'hips' | 'map' | 'heart' | 'wave' | 'braid';
export type KarimaExpression =
  | 'happy'
  | 'wonder'
  | 'curious'
  | 'sly'
  | 'flirt'
  | 'wink'
  | 'dreamy'
  | 'confused'
  | 'sad'
  | 'cross'
  | 'sleep'
  | 'laugh';

type Pt = {x: number; y: number};

export type KarimaProps = {
  pose?: KarimaPose;
  expression?: KarimaExpression;
  /** 0 = offen, 1 = geschlossen. */
  blink?: number;
  /** Gangphase (1 = ein Doppelschritt). Für walk + hop. */
  walkCycle?: number;
  /** 1 = schaut nach rechts, -1 = nach links. */
  facing?: 1 | -1;
  lookX?: number;
  lookY?: number;
  headTilt?: number;
  withSuitcase?: boolean;
  /** Umhang weht (Grad, positiv = nach hinten). */
  capeWind?: number;
  /** Kapuze auf (Rotkäppchen). */
  hood?: boolean;
  /** 0..1 Erröten. */
  blush?: number;
  /** Freie Handpositionen (überschreiben die Pose). Lokale Koordinaten, Fußpunkt = 0,0. */
  handFront?: Pt;
  handBack?: Pt;
  /** Requisit in der vorderen Hand. */
  holding?: React.ReactNode;
  id?: string;
};

/** Kopfmittelpunkt relativ zum Fußpunkt — für Kamera/Iris-Ziele. */
export const KARIMA_HEAD = {x: 0, y: -462};
export const KARIMA_HEIGHT = 530;

const TAU = Math.PI * 2;
const deg = (d: number) => (d * Math.PI) / 180;

const Boot: React.FC<{at: Pt; tilt: number; salt: string}> = ({at, tilt, salt}) => (
  <g transform={`translate(${at.x},${at.y}) rotate(${tilt})`}>
    <Rough
      shape={{kind: 'path', d: 'M-8,-26 L-8,-6 C-10,4 -2,8 12,8 C24,8 28,2 24,-4 C18,-8 8,-8 6,-12 L6,-26 Z'}}
      salt={`${salt}-boot`}
      fill={palette.rosenrot}
      wash={palette.rosenrot}
      washOpacity={0.55}
      hachureGap={3}
      strokeWidth={2.2}
    />
    {/* kleiner Absatz */}
    <Rough shape={{kind: 'line', x1: -6, y1: 8, x2: -4, y2: 14}} salt={`${salt}-heel`} strokeWidth={3} />
  </g>
);

const Hand: React.FC<{at: Pt; salt: string; finger?: boolean}> = ({at, salt, finger}) => (
  <g transform={`translate(${at.x},${at.y})`}>
    <Rough shape={{kind: 'ellipse', cx: 0, cy: 0, w: 16, h: 18}} salt={`${salt}-hand`} fill={palette.skin} fillStyle="solid" strokeWidth={2} />
    {finger ? (
      <Rough shape={{kind: 'path', d: 'M-1,-7 C-2,-17 3,-20 4,-11 L3,-5'}} salt={`${salt}-finger`} fill={palette.skin} fillStyle="solid" strokeWidth={1.8} />
    ) : (
      <Rough shape={{kind: 'path', d: 'M-5,-5 Q-10,-10 -5,-12'}} salt={`${salt}-thumb`} strokeWidth={1.6} />
    )}
  </g>
);

/** Mandelförmiges Auge mit Wimpern; lid 0..1 = Oberlid gesenkt (flirtend). */
const Eye: React.FC<{x: number; blink: number; lid: number; look: Pt; wide: boolean; outer: 1 | -1; salt: string; happyClosed?: boolean}> = ({
  x,
  blink,
  lid,
  look,
  wide,
  outer,
  salt,
  happyClosed,
}) => {
  const w = wide ? 30 : 28;
  const h = (wide ? 36 : 32) * Math.max(0.08, 1 - blink);
  const lashes = (
    <Rough
      shape={{kind: 'path', d: `M${x + outer * 11},${-6} l${outer * 9},-7 M${x + outer * 6},${-10} l${outer * 6},-8 M${x + outer * 13},${-1} l${outer * 9},-2`}}
      salt={`${salt}-lash`}
      strokeWidth={2.2}
    />
  );
  if (blink > 0.85) {
    const d = happyClosed ? `M${x - 13},${6} Q${x},${-4} ${x + 13},${6}` : `M${x - 13},${2} Q${x},${12} ${x + 13},${2}`;
    return (
      <g>
        <Rough shape={{kind: 'path', d}} salt={`${salt}-lid`} strokeWidth={3} />
        {lashes}
      </g>
    );
  }
  const pw = 13;
  const ph = Math.min(h * 0.62, 18);
  const px = x + look.x * (w / 2 - pw / 2 - 2);
  const py = 3 + look.y * Math.max(0, h / 2 - ph / 2 - 2);
  const lidY = -h / 2 + 3 + lid * h * 0.55;
  return (
    <g>
      <Rough
        shape={{kind: 'path', d: `M${x - w / 2},3 C${x - w / 3},${3 - h / 2 - 2} ${x + w / 3},${3 - h / 2 - 2} ${x + w / 2},3 C${x + w / 3},${3 + h / 2} ${x - w / 3},${3 + h / 2} ${x - w / 2},3 Z`}}
        salt={`${salt}-white`}
        fill={palette.white}
        fillStyle="solid"
        strokeWidth={2.4}
      />
      <ellipse cx={px} cy={py} rx={pw / 2} ry={ph / 2} fill={palette.ink} />
      <ellipse cx={px - 2.5} cy={py - ph * 0.22} rx={2.4} ry={2.2} fill={palette.white} />
      {lid > 0.05 ? (
        <path
          d={`M${x - w / 2 - 1},3 C${x - w / 3},${3 - h / 2 - 3} ${x + w / 3},${3 - h / 2 - 3} ${x + w / 2 + 1},3 L${x + w / 2 + 1},${lidY + 3} Q${x},${lidY + 8} ${x - w / 2 - 1},${lidY + 3} Z`}
          fill={palette.skin}
          stroke={palette.ink}
          strokeWidth={2.6}
        />
      ) : null}
      {lashes}
    </g>
  );
};

const Lips: React.FC<{expression: KarimaExpression; s: (n: string) => string}> = ({expression, s}) => {
  const red = palette.rosenrot;
  switch (expression) {
    case 'wonder':
      return <Rough shape={{kind: 'ellipse', cx: 0, cy: 40, w: 14, h: 16}} salt={s('lO')} fill={red} wash={red} washOpacity={0.7} hachureGap={2.4} strokeWidth={2.2} />;
    case 'sad':
      return <Rough shape={{kind: 'path', d: 'M-12,44 Q0,36 12,44 Q0,42 -12,44 Z'}} salt={s('lS')} fill={red} fillStyle="solid" strokeWidth={2.2} />;
    case 'cross':
      return <Rough shape={{kind: 'path', d: 'M-12,42 Q0,40 12,42 Q0,46 -12,42 Z'}} salt={s('lX')} fill={red} fillStyle="solid" strokeWidth={2.4} />;
    case 'confused':
      return <Rough shape={{kind: 'path', d: 'M-12,42 Q-4,36 2,42 Q8,46 14,40'}} salt={s('lZ')} stroke={red} strokeWidth={3.4} />;
    case 'sleep':
    case 'dreamy':
      return <Rough shape={{kind: 'path', d: 'M-12,38 Q0,48 12,38 Q0,44 -12,38 Z'}} salt={s('lD')} fill={red} fillStyle="solid" strokeWidth={2.2} />;
    case 'flirt':
    case 'sly':
    case 'wink':
    case 'curious':
      // schiefes, verschmitztes Lächeln
      return <Rough shape={{kind: 'path', d: 'M-14,38 C-6,48 10,48 18,32 C10,40 -4,42 -14,38 Z'}} salt={s('lF')} fill={red} wash={red} washOpacity={0.6} hachureGap={2.4} strokeWidth={2.4} />;
    case 'laugh':
      return <Rough shape={{kind: 'path', d: 'M-20,32 C-14,58 14,58 20,32 Q0,38 -20,32 Z'}} salt={s('lL')} fill={red} wash={palette.ink} washOpacity={0.3} hachureGap={2.4} strokeWidth={2.4} />;
    default:
      return (
        <g>
          <Rough shape={{kind: 'path', d: 'M-20,32 C-12,52 12,52 20,32 Q0,40 -20,32 Z'}} salt={s('lH')} fill={red} wash={red} washOpacity={0.55} hachureGap={2.4} strokeWidth={2.4} />
          <Rough shape={{kind: 'path', d: 'M-12,38 Q0,42 12,38'}} salt={s('lHt')} stroke={palette.white} strokeWidth={2} multiStroke={false} />
        </g>
      );
  }
};

const Head: React.FC<{expression: KarimaExpression; blink: number; look: Pt; braidSwing: number; hood: boolean; blush: number; id: string}> = ({
  expression,
  blink,
  look,
  braidSwing,
  hood,
  blush,
  id,
}) => {
  const s = (n: string) => `${id}-head-${n}`;
  const wide = expression === 'wonder';
  const closed = expression === 'sleep' || expression === 'laugh' || expression === 'dreamy' ? 1 : blink;
  const lid = expression === 'flirt' ? 0.55 : expression === 'sly' ? 0.4 : expression === 'curious' ? 0.15 : 0;
  const blinkR = expression === 'wink' ? 1 : closed;
  const browLift = expression === 'wonder' ? -7 : expression === 'flirt' ? -4 : expression === 'curious' ? -3 : 0;
  const browL =
    expression === 'cross' ? 'M-34,-22 L-12,-14' : expression === 'sad' ? 'M-34,-14 Q-24,-22 -12,-24' : `M-34,${-16 + browLift} Q-24,${-25 + browLift} -12,${-19 + browLift}`;
  const browR =
    expression === 'cross'
      ? 'M12,-14 L34,-22'
      : expression === 'sad'
        ? 'M12,-24 Q24,-22 34,-14'
        : expression === 'flirt' || expression === 'sly'
          ? `M12,${-24} Q24,${-32} 34,${-22}`
          : `M12,${-19 + browLift} Q24,${-25 + browLift} 34,${-16 + browLift}`;

  // Zopf über die linke Schulter nach vorn
  const braid: React.ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const bx = -38 - i * 2 + Math.sin(braidSwing + i * 0.5) * i * 1.6;
    const by = 40 + i * 20;
    braid.push(<Rough key={i} shape={{kind: 'ellipse', cx: bx, cy: by, w: 20 - i * 1.4, h: 24}} salt={s(`braid${i}`)} fill={palette.hair} fillStyle="cross-hatch" hachureGap={3} fillWeight={1.3} strokeWidth={2} />);
  }
  const tip = {x: -48 + Math.sin(braidSwing + 3) * 6, y: 160};

  return (
    <g>
      {hood ? (
        <Rough
          shape={{kind: 'path', d: 'M-74,40 C-90,-40 -60,-98 0,-100 C60,-98 90,-40 74,40 C60,10 48,-50 0,-56 C-48,-50 -60,10 -74,40 Z'}}
          salt={s('hood')}
          fill={palette.rosenrot}
          wash={palette.rosenrot}
          washOpacity={0.55}
          hachureGap={4}
          strokeWidth={2.6}
        />
      ) : null}
      {/* Haar-Masse hinten (lang, dunkel) */}
      <Rough
        shape={{kind: 'path', d: 'M-58,30 C-72,-40 -48,-80 0,-80 C48,-80 72,-40 60,24 C58,-10 44,-46 0,-48 C-44,-46 -56,-10 -58,30 Z'}}
        salt={s('hairback')}
        fill={palette.hair}
        fillStyle="cross-hatch"
        hachureGap={3.2}
        fillWeight={1.4}
        strokeWidth={2.4}
      />
      {[-1, 1].map((side) => (
        <g key={side}>
          <Rough shape={{kind: 'ellipse', cx: side * 49, cy: 8, w: 13, h: 20}} salt={s(`ear${side}`)} fill={palette.skin} fillStyle="solid" strokeWidth={2} />
          {/* Ohrring: kleiner Goldtropfen */}
          <Rough shape={{kind: 'path', d: `M${side * 50},18 L${side * 50},24`}} salt={s(`ering-l${side}`)} strokeWidth={1.4} />
          <Rough shape={{kind: 'path', d: `M${side * 50},24 C${side * 44},32 ${side * 46},38 ${side * 50},38 C${side * 54},38 ${side * 56},32 ${side * 50},24 Z`}} salt={s(`ering${side}`)} fill={palette.senf} fillStyle="solid" strokeWidth={1.6} />
        </g>
      ))}
      {/* ovales Gesicht mit schmalem Kinn */}
      <Rough
        shape={{kind: 'path', d: 'M-48,-12 C-50,26 -28,62 0,64 C28,62 50,26 48,-12 C46,-44 26,-56 0,-56 C-26,-56 -46,-44 -48,-12 Z'}}
        salt={s('face')}
        fill={palette.skin}
        fillStyle="solid"
        strokeWidth={2.6}
      />
      {/* Pony, seitlich geschwungen */}
      <Rough
        shape={{
          kind: 'path',
          d: 'M-54,8 C-60,-48 -32,-70 2,-70 C36,-70 60,-48 54,4 C50,-10 46,-20 38,-16 C32,-28 22,-30 14,-22 C8,-34 -6,-34 -12,-24 C-20,-34 -32,-32 -36,-20 C-44,-26 -50,-14 -54,8 Z',
        }}
        salt={s('bangs')}
        fill={palette.hair}
        fillStyle="cross-hatch"
        hachureGap={2.8}
        fillWeight={1.4}
        strokeWidth={2.4}
      />
      <Rough shape={{kind: 'path', d: 'M-24,-58 Q-6,-66 14,-62'}} salt={s('shine')} stroke={palette.white} strokeWidth={3.4} multiStroke={false} />
      <Rough shape={{kind: 'path', d: browL}} salt={s('browL')} strokeWidth={2.4} />
      <Rough shape={{kind: 'path', d: browR}} salt={s('browR')} strokeWidth={2.4} />
      <Eye x={-20} blink={closed} lid={lid} look={look} wide={wide} outer={-1} salt={s('eyeL')} happyClosed={expression === 'laugh'} />
      <Eye x={20} blink={blinkR} lid={lid} look={look} wide={wide} outer={1} salt={s('eyeR')} happyClosed={expression === 'laugh' || expression === 'wink'} />
      {/* Wangen / Erröten */}
      {[-1, 1].map((side) => (
        <Rough
          key={side}
          shape={{kind: 'ellipse', cx: side * 32, cy: 28, w: 22 + blush * 10, h: 12 + blush * 6}}
          salt={s(`cheek${side}`)}
          stroke="transparent"
          fill={palette.rosa}
          wash={blush > 0.3 ? palette.rosenrot : palette.rosa}
          washOpacity={0.4 + blush * 0.3}
          hachureGap={2.6}
          hachureAngle={30}
        />
      ))}
      <Rough shape={{kind: 'path', d: 'M-2,14 Q2,24 6,20'}} salt={s('nose')} strokeWidth={2} />
      {/* Schönheitsfleck */}
      <circle cx={26} cy={44} r={1.8} fill={palette.ink} />
      <Lips expression={expression} s={s} />
      {braid}
      <g transform={`translate(${tip.x},${tip.y})`}>
        <Rough shape={{kind: 'path', d: 'M0,-6 C-12,-16 -16,0 -2,-2 Z M0,-6 C12,-16 16,0 2,-2 Z'}} salt={s('bow')} fill={palette.rosenrot} fillStyle="solid" strokeWidth={1.8} />
        <Rough shape={{kind: 'path', d: 'M-3,0 L-6,12 M0,0 L0,14 M3,0 L6,11'}} salt={s('tuft')} strokeWidth={1.8} />
      </g>
    </g>
  );
};

/**
 * KARIMA — junge, zierliche Frau: dunkles Haar mit schraffiertem Pony und Zopf über der
 * Schulter, kleine Goldohrringe, großes Lächeln, große neugierige Augen mit Wimpern.
 * Schlichtes, tailliertes Kleid mit kurzem rotem Kapuzenumhang (Rotkäppchen-Motiv).
 * Rubber-Hose-Glieder. Ursprung (0,0) = Mitte zwischen den Füßen.
 */
export const Karima: React.FC<KarimaProps> = ({
  pose = 'stand',
  expression = 'happy',
  blink = 0,
  walkCycle = 0,
  facing = 1,
  lookX = 0.3,
  lookY = 0,
  headTilt = 0,
  withSuitcase = false,
  capeWind = 0,
  hood = false,
  blush = 0,
  handFront: hfOverride,
  handBack: hbOverride,
  holding,
  id = 'karima',
}) => {
  const walking = pose === 'walk' || pose === 'hop';
  const hop = pose === 'hop';
  const ph = walkCycle * TAU;

  const bob = walking ? -Math.abs(Math.sin(ph)) * (hop ? 40 : 14) : 0;
  const squash = walking ? 1 + Math.cos(ph * 2) * (hop ? 0.05 : 0.025) : 1;
  // Hüftschwung beim Gehen
  const sway = walking ? Math.sin(ph) * 5 : Math.sin(walkCycle * 2) * 0;

  const hipY = -232;
  const legLen = 222;
  const hipL: Pt = {x: -12, y: hipY};
  const hipR: Pt = {x: 12, y: hipY};
  const swing = walking ? (hop ? 16 : 20) : 0;
  const aL = Math.sin(ph) * swing;
  const aR = -Math.sin(ph) * swing;
  const liftL = walking ? Math.max(0, Math.cos(ph)) * 26 : 0;
  const liftR = walking ? Math.max(0, -Math.cos(ph)) * 26 : 0;
  const tuck = hop ? Math.abs(Math.sin(ph)) * 34 : 0;
  const legPose = (hip: Pt, angle: number, lift: number): Pt => ({
    x: hip.x + Math.sin(deg(angle)) * legLen,
    y: hip.y + Math.cos(deg(angle)) * legLen - lift,
  });
  // Stand: ein Bein leicht vor das andere (elegant)
  const footL = walking ? legPose(hipL, aL, liftL + tuck) : {x: -14, y: -4};
  const footR = walking ? legPose(hipR, aR, liftR + tuck) : {x: 20, y: -6};
  const bendL = walking ? -10 - liftL - tuck * 0.6 : -8;
  const bendR = walking ? -10 - liftR - tuck * 0.6 : 10;

  const shoulderY = -388;
  const sB: Pt = {x: -30, y: shoulderY};
  const sF: Pt = {x: 30, y: shoulderY};

  let hB: Pt;
  let hF: Pt;
  let bB = 14;
  let bF = -14;
  let fingerF = false;
  switch (pose) {
    case 'walk':
    case 'hop': {
      const armSwing = Math.sin(ph) * (hop ? 40 : 28);
      hB = {x: -46 + armSwing, y: -250 - Math.abs(armSwing) * (hop ? 0.8 : 0.2)};
      hF = {x: 48 - armSwing * 0.5, y: withSuitcase ? -240 : -250};
      bB = 12 + armSwing * 0.3;
      bF = -14;
      break;
    }
    case 'wonder':
      hB = {x: -96, y: -440};
      hF = withSuitcase ? {x: 50, y: -240} : {x: 96, y: -440};
      bB = -26;
      bF = withSuitcase ? -12 : 26;
      break;
    case 'reach':
      hB = {x: -50, y: -258};
      hF = {x: 120, y: -470};
      bB = 14;
      bF = 30;
      break;
    case 'shush':
      hB = {x: -50, y: -250};
      hF = {x: 10, y: -416};
      bB = 12;
      bF = 36;
      fingerF = true;
      break;
    case 'hips':
      hB = {x: -44, y: -300};
      hF = {x: 44, y: -300};
      bB = -30;
      bF = 30;
      break;
    case 'map':
      hB = {x: -36, y: -320};
      hF = {x: 52, y: -320};
      bB = 18;
      bF = -18;
      break;
    case 'heart':
      hB = {x: -10, y: -340};
      hF = {x: 8, y: -346};
      bB = 22;
      bF = 22;
      break;
    case 'wave':
      hB = {x: -50, y: -250};
      hF = {x: 80, y: -500};
      bB = 12;
      bF = 24;
      break;
    case 'braid':
      // spielt mit dem Zopf
      hB = {x: -50, y: -250};
      hF = {x: -26, y: -350};
      bB = 12;
      bF = 34;
      break;
    default:
      hB = {x: -48, y: -248};
      hF = {x: 48, y: -244};
  }
  if (hbOverride) hB = hbOverride;
  if (hfOverride) hF = hfOverride;

  const braidSwing = walking ? ph : 0;
  const look = {x: lookX, y: lookY};
  const k = (n: string) => `${id}-${n}`;
  const cw = capeWind + (walking ? Math.sin(ph * 2) * 5 : 0);
  const hem = walking ? Math.sin(ph) * 8 : 0;

  return (
    <g transform={`scale(${facing},1)`}>
      <ellipse cx={0} cy={2} rx={Math.max(20, 54 + bob * 0.6)} ry={8} fill={palette.ink} opacity={0.13} />
      <g transform={`translate(${sway},${bob}) scale(${1 / squash},${squash})`}>
        {/* Umhang hinten (Rotkäppchen-Rot) */}
        <g transform={`rotate(${cw * 0.4},0,-396)`}>
          <Rough
            shape={{kind: 'path', d: `M-36,-398 C-60,-360 ${-74 - cw},-300 ${-70 - cw * 1.5},-262 Q-40,-252 -10,-268 Q10,-256 30,-268 C40,-320 38,-370 34,-398 Z`}}
            salt={k('cape')}
            fill={palette.rosenrot}
            wash={palette.rosenrot}
            washOpacity={0.55}
            hachureGap={5}
            hachureAngle={40}
            strokeWidth={2.6}
          />
        </g>
        <HoseLimb from={hipL} to={{x: footL.x, y: footL.y - bob}} bend={bendL} thickness={11} salt={k('legL')} />
        <HoseLimb from={hipR} to={{x: footR.x, y: footR.y - bob}} bend={bendR} thickness={11} salt={k('legR')} />
        <Boot at={{x: footL.x, y: footL.y - bob}} tilt={walking ? aL * 0.5 : 0} salt={k('bootL')} />
        <Boot at={{x: footR.x, y: footR.y - bob}} tilt={walking ? aR * 0.5 : 6} salt={k('bootR')} />

        <HoseLimb from={sB} to={hB} bend={bB} thickness={10} color={palette.skin} salt={k('armB')} />
        <Hand at={hB} salt={k('handB')} />

        {/* Kleid: tailliert, schwingender Rock bis zur Wade */}
        <Rough
          shape={{
            kind: 'path',
            d: `M-28,-394 C-34,-370 -30,-340 -22,-318 C-20,-308 -24,-300 -26,-296 C-50,-250 ${-80 - hem},-190 ${-88 - hem},-150 Q-60,-138 -30,-148 Q0,-136 30,-148 Q60,-138 ${88 - hem},-150 C${80 - hem},-190 50,-250 26,-296 C24,-300 20,-308 22,-318 C30,-340 34,-370 28,-394 Q0,-404 -28,-394 Z`,
          }}
          salt={k('dress')}
          base={palette.paper}
          fill={palette.rosa}
          wash={palette.rosa}
          washOpacity={0.55}
          hachureGap={5}
          hachureAngle={-50}
          strokeWidth={2.6}
        />
        {/* Mieder-Schnürung + Gürtel */}
        <Rough shape={{kind: 'path', d: 'M-24,-304 Q0,-296 24,-304'}} salt={k('belt')} stroke={palette.rosenrot} strokeWidth={4} />
        <Rough shape={{kind: 'path', d: 'M-6,-372 L6,-360 L-6,-348 L6,-336 L-6,-324 L6,-312'}} salt={k('lace')} stroke={palette.rosenrot} strokeWidth={1.6} />
        {/* Ausschnitt-Bogen */}
        <Rough shape={{kind: 'path', d: 'M-20,-394 Q0,-378 20,-394'}} salt={k('neckline')} strokeWidth={2} />
        {/* kurzer Umhang vorn über den Schultern + Schleife */}
        <Rough
          shape={{kind: 'path', d: 'M-38,-398 C-50,-378 -52,-362 -46,-354 Q-30,-362 -14,-368 L14,-368 Q30,-362 46,-354 C52,-362 50,-378 38,-398 Q0,-410 -38,-398 Z'}}
          salt={k('capelet')}
          base={palette.paper}
          fill={palette.rosenrot}
          wash={palette.rosenrot}
          washOpacity={0.6}
          hachureGap={4}
          hachureAngle={40}
          strokeWidth={2.4}
        />
        <Rough shape={{kind: 'path', d: 'M0,-392 C-10,-402 -14,-388 -2,-388 M0,-392 C10,-402 14,-388 2,-388 M-2,-388 L-6,-376 M2,-388 L6,-376'}} salt={k('tie')} stroke={palette.white} strokeWidth={2.2} />

        {/* Hals */}
        <Rough shape={{kind: 'path', d: 'M-6,-396 L-6,-414 M6,-396 L6,-414'}} salt={k('neck')} strokeWidth={2} />
        <g transform={`translate(${KARIMA_HEAD.x},${KARIMA_HEAD.y}) rotate(${headTilt + sway * 0.4})`}>
          <Head expression={expression} blink={blink} look={look} braidSwing={braidSwing} hood={hood} blush={blush} id={id} />
        </g>

        <HoseLimb from={sF} to={hF} bend={bF} thickness={10} color={palette.skin} salt={k('armF')} />
        {withSuitcase ? (
          <g transform={`translate(${hF.x},${hF.y}) scale(0.9)`}>
            <Suitcase id={k('case')} swing={walking ? Math.sin(ph) * (hop ? 12 : 5) : 0} />
          </g>
        ) : null}
        {holding ? <g transform={`translate(${hF.x},${hF.y})`}>{holding}</g> : null}
        <Hand at={hF} salt={k('handF')} finger={fingerF} />
      </g>
    </g>
  );
};

/** Blinzeln: kurze Lidschläge zu festen Zeitpunkten (Frames). */
export const blinkAt = (frame: number, at: number[], length = 6) => {
  for (const b of at) {
    const t = frame - b;
    if (t >= 0 && t < length) return Math.sin((t / (length - 1)) * Math.PI);
  }
  return 0;
};
