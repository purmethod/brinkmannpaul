import React from 'react';
import {palette} from '../theme';
import {HoseLimb} from './HoseLimb';
import {Rough} from './Rough';
import {Suitcase} from './Suitcase';

export type KarimaPose = 'stand' | 'walk' | 'hop' | 'wonder' | 'reach' | 'shush' | 'hips' | 'map' | 'heart' | 'wave';
export type KarimaExpression = 'happy' | 'wonder' | 'curious' | 'sly' | 'confused' | 'sad' | 'cross' | 'sleep' | 'laugh';

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
  /** Freie Handpositionen (überschreiben die Pose). Lokale Koordinaten, Fußpunkt = 0,0. */
  handFront?: Pt;
  handBack?: Pt;
  /** Requisit in der vorderen Hand. */
  holding?: React.ReactNode;
  id?: string;
};

/** Kopfmittelpunkt relativ zum Fußpunkt — für Kamera/Iris-Ziele. */
export const KARIMA_HEAD = {x: 0, y: -292};
export const KARIMA_HEIGHT = 380;

const TAU = Math.PI * 2;
const deg = (d: number) => (d * Math.PI) / 180;

const Shoe: React.FC<{at: Pt; tilt: number; salt: string}> = ({at, tilt, salt}) => (
  <g transform={`translate(${at.x},${at.y}) rotate(${tilt})`}>
    <Rough
      shape={{kind: 'path', d: 'M-12,-10 C-14,4 -6,10 10,10 C26,10 30,0 24,-6 C18,-12 2,-14 -12,-10 Z'}}
      salt={`${salt}-shoe`}
      fill={palette.rosenrot}
      wash={palette.rosenrot}
      washOpacity={0.45}
      hachureGap={3.5}
      strokeWidth={2.2}
    />
  </g>
);

const Hand: React.FC<{at: Pt; salt: string; finger?: boolean}> = ({at, salt, finger}) => (
  <g transform={`translate(${at.x},${at.y})`}>
    <Rough shape={{kind: 'circle', cx: 0, cy: 0, d: 20}} salt={`${salt}-hand`} fill={palette.skin} fillStyle="solid" strokeWidth={2.2} />
    {finger ? (
      <Rough
        shape={{kind: 'path', d: 'M-2,-8 C-3,-18 3,-22 4,-12 L3,-6'}}
        salt={`${salt}-finger`}
        fill={palette.skin}
        fillStyle="solid"
        strokeWidth={2}
      />
    ) : (
      <Rough shape={{kind: 'path', d: 'M-6,-6 Q-12,-12 -6,-14'}} salt={`${salt}-thumb`} strokeWidth={1.8} />
    )}
  </g>
);

const Eye: React.FC<{x: number; blink: number; look: Pt; wide: boolean; salt: string; happyClosed?: boolean}> = ({
  x,
  blink,
  look,
  wide,
  salt,
  happyClosed,
}) => {
  const w = wide ? 36 : 32;
  const h = (wide ? 50 : 44) * Math.max(0.08, 1 - blink);
  if (blink > 0.85) {
    // geschlossen: fröhlicher Bogen (oder Schlaf-Bogen nach unten)
    const d = happyClosed ? `M${x - 15},${10} Q${x},${-2} ${x + 15},${10}` : `M${x - 15},${4} Q${x},${16} ${x + 15},${4}`;
    return <Rough shape={{kind: 'path', d}} salt={`${salt}-lid`} strokeWidth={3} />;
  }
  const pw = wide ? 17 : 15;
  const ph = Math.min(h * 0.55, wide ? 24 : 21);
  const px = x + look.x * (w / 2 - pw / 2 - 2);
  const py = 4 + look.y * (h / 2 - ph / 2 - 2) + 4;
  return (
    <g>
      <Rough shape={{kind: 'ellipse', cx: x, cy: 4, w, h}} salt={`${salt}-white`} fill={palette.white} fillStyle="solid" strokeWidth={2.6} />
      <ellipse cx={px} cy={py} rx={pw / 2} ry={ph / 2} fill={palette.ink} />
      <ellipse cx={px - pw * 0.18} cy={py - ph * 0.22} rx={pw * 0.17} ry={ph * 0.15} fill={palette.white} />
    </g>
  );
};

const Mouth: React.FC<{expression: KarimaExpression; s: (n: string) => string}> = ({expression, s}) => {
  switch (expression) {
    case 'wonder':
      return (
        <Rough shape={{kind: 'ellipse', cx: 0, cy: 46, w: 16, h: 20}} salt={s('mO')} fill={palette.rosenrot} wash={palette.ink} washOpacity={0.55} hachureGap={3} strokeWidth={2.6} />
      );
    case 'curious':
    case 'sly':
      return (
        <Rough shape={{kind: 'path', d: 'M-18,40 C-8,54 14,52 24,36 C14,44 -4,46 -18,40 Z'}} salt={s('mC')} fill={palette.rosenrot} wash={palette.rosenrot} washOpacity={0.4} hachureGap={3} strokeWidth={2.6} />
      );
    case 'confused':
      return <Rough shape={{kind: 'path', d: 'M-18,46 Q-9,38 0,46 Q9,54 18,44'}} salt={s('mZ')} strokeWidth={2.8} />;
    case 'sad':
      return <Rough shape={{kind: 'path', d: 'M-16,52 Q0,40 16,52'}} salt={s('mS')} strokeWidth={2.8} />;
    case 'cross':
      return <Rough shape={{kind: 'line', x1: -14, y1: 48, x2: 14, y2: 46}} salt={s('mX')} strokeWidth={3} />;
    case 'sleep':
      return <Rough shape={{kind: 'path', d: 'M-12,44 Q0,52 12,44'}} salt={s('mZz')} strokeWidth={2.6} />;
    case 'laugh':
      return (
        <Rough shape={{kind: 'path', d: 'M-30,34 C-22,72 22,72 30,34 Z'}} salt={s('mL')} fill={palette.rosenrot} wash={palette.ink} washOpacity={0.35} hachureGap={3} strokeWidth={2.8} />
      );
    default:
      return (
        <Rough shape={{kind: 'path', d: 'M-28,36 C-20,64 20,64 28,36 C14,44 -14,44 -28,36 Z'}} salt={s('mH')} fill={palette.rosenrot} wash={palette.rosenrot} washOpacity={0.45} hachureGap={3} strokeWidth={2.8} />
      );
  }
};

const Head: React.FC<{expression: KarimaExpression; blink: number; look: Pt; braidSwing: number; id: string}> = ({
  expression,
  blink,
  look,
  braidSwing,
  id,
}) => {
  const s = (n: string) => `${id}-head-${n}`;
  const wide = expression === 'wonder';
  const browLift = expression === 'wonder' ? -8 : expression === 'curious' ? -3 : 0;
  const closed = expression === 'sleep' || expression === 'laugh' ? 1 : blink;
  // sly: ein Auge halb zu
  const blinkR = expression === 'sly' ? Math.max(blink, 0.45) : closed;

  const braid: React.ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const bx = -62 - i * 3 + Math.sin(braidSwing + i * 0.5) * i * 2.4;
    const by = 6 + i * 21;
    braid.push(
      <Rough key={i} shape={{kind: 'ellipse', cx: bx, cy: by, w: 24 - t * 6, h: 26}} salt={s(`braid${i}`)} fill={palette.hair} fillStyle="cross-hatch" hachureGap={3.2} fillWeight={1.3} strokeWidth={2.2} />,
    );
  }
  const tipX = -74 + Math.sin(braidSwing + 2.5) * 10;
  const tipY = 110;

  const browL =
    expression === 'cross'
      ? `M-38,-20 L-14,-10`
      : expression === 'sad'
        ? `M-38,-10 Q-26,-18 -14,-20`
        : `M-38,${-12 + browLift} Q-26,${-20 + browLift} -14,${-14 + browLift}`;
  const browR =
    expression === 'cross'
      ? `M14,-10 L38,-20`
      : expression === 'sad'
        ? `M14,-20 Q26,-18 38,-10`
        : expression === 'confused'
          ? `M14,-24 Q26,-30 38,-22`
          : `M14,${-14 + browLift} Q26,${-20 + browLift} 38,${-12 + browLift}`;

  return (
    <g>
      {braid}
      <g transform={`translate(${tipX},${tipY - 10})`}>
        <Rough shape={{kind: 'path', d: 'M0,0 C-14,-12 -20,6 -4,4 Z M0,0 C14,-12 20,6 4,4 Z'}} salt={s('bow')} fill={palette.rosenrot} wash={palette.rosenrot} washOpacity={0.5} hachureGap={3} strokeWidth={2} />
      </g>
      <Rough
        shape={{kind: 'path', d: 'M-70,20 C-82,-40 -60,-84 0,-86 C60,-84 82,-40 70,18 C64,-20 50,-50 0,-52 C-50,-50 -64,-20 -70,20 Z'}}
        salt={s('hairback')}
        fill={palette.hair}
        fillStyle="cross-hatch"
        hachureGap={3.4}
        fillWeight={1.4}
        strokeWidth={2.6}
      />
      {[-1, 1].map((side) => (
        <g key={side}>
          <Rough shape={{kind: 'ellipse', cx: side * 64, cy: 12, w: 18, h: 24}} salt={s(`ear${side}`)} fill={palette.skin} fillStyle="solid" strokeWidth={2.2} />
          <Rough shape={{kind: 'line', x1: side * 65, y1: 24, x2: side * 65, y2: 31}} salt={s(`ering-l${side}`)} strokeWidth={1.6} />
          <Rough shape={{kind: 'circle', cx: side * 65, cy: 36, d: 10}} salt={s(`ering${side}`)} fill={palette.senf} wash={palette.senf} washOpacity={0.8} hachureGap={2.5} strokeWidth={1.8} />
        </g>
      ))}
      <Rough
        shape={{kind: 'path', d: 'M-62,-10 C-66,40 -36,66 0,66 C36,66 66,40 62,-10 C58,-46 34,-60 0,-60 C-34,-60 -58,-46 -62,-10 Z'}}
        salt={s('face')}
        fill={palette.skin}
        fillStyle="solid"
        strokeWidth={2.8}
      />
      <Rough
        shape={{
          kind: 'path',
          d: 'M-66,4 C-70,-50 -40,-74 0,-74 C40,-74 70,-50 66,4 C60,-14 54,-20 46,-14 C40,-26 30,-28 22,-18 C16,-30 4,-30 -2,-20 C-10,-30 -22,-30 -26,-18 C-34,-28 -46,-26 -50,-12 C-56,-20 -62,-12 -66,4 Z',
        }}
        salt={s('bangs')}
        fill={palette.hair}
        fillStyle="cross-hatch"
        hachureGap={3}
        fillWeight={1.4}
        strokeWidth={2.6}
      />
      <Rough shape={{kind: 'path', d: 'M-30,-58 Q-10,-66 12,-62'}} salt={s('shine')} stroke={palette.white} strokeWidth={4} multiStroke={false} />
      <Rough shape={{kind: 'path', d: browL}} salt={s('browL')} strokeWidth={2.6} />
      <Rough shape={{kind: 'path', d: browR}} salt={s('browR')} strokeWidth={2.6} />
      <Eye x={-25} blink={closed} look={look} wide={wide} salt={s('eyeL')} happyClosed={expression === 'laugh'} />
      <Eye x={25} blink={blinkR} look={look} wide={wide} salt={s('eyeR')} happyClosed={expression === 'laugh'} />
      {[-1, 1].map((side) => (
        <Rough key={side} shape={{kind: 'circle', cx: side * 42, cy: 36, d: 20}} salt={s(`cheek${side}`)} stroke="transparent" fill={palette.rosa} wash={palette.rosa} washOpacity={0.55} hachureGap={3.2} hachureAngle={30} />
      ))}
      <Rough shape={{kind: 'path', d: 'M-3,26 Q2,32 6,26'}} salt={s('nose')} strokeWidth={2.2} />
      <Mouth expression={expression} s={s} />
    </g>
  );
};

/**
 * KARIMA — zierlich, dunkles Haar mit schraffiertem Pony und Zopf, kleine Ohrringe,
 * großes Lächeln, große neugierige Augen. Schlichtes Kleid mit kurzem Umhang.
 * Rubber-Hose-Glieder. Ursprung (0,0) = Mitte zwischen den Füßen auf dem Boden.
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
  handFront: hfOverride,
  handBack: hbOverride,
  holding,
  id = 'karima',
}) => {
  const walking = pose === 'walk' || pose === 'hop';
  const hop = pose === 'hop';
  const ph = walkCycle * TAU;

  const bob = walking ? -Math.abs(Math.sin(ph)) * (hop ? 46 : 16) : 0;
  const squash = walking ? 1 + Math.cos(ph * 2) * (hop ? 0.06 : 0.03) : 1;
  const sway = walking ? Math.sin(ph) * 3 : 0;

  const hipY = -118;
  const legLen = 112;
  const hipL: Pt = {x: -14, y: hipY};
  const hipR: Pt = {x: 14, y: hipY};
  const swing = walking ? (hop ? 18 : 25) : 0;
  const aL = Math.sin(ph) * swing;
  const aR = -Math.sin(ph) * swing;
  const liftL = walking ? Math.max(0, Math.cos(ph)) * 22 : 0;
  const liftR = walking ? Math.max(0, -Math.cos(ph)) * 22 : 0;
  const legPose = (hip: Pt, angle: number, lift: number): Pt => ({
    x: hip.x + Math.sin(deg(angle)) * legLen,
    y: hip.y + Math.cos(deg(angle)) * legLen - lift,
  });
  // Beim Hüpfen: Beine angezogen in der Luft
  const tuck = hop ? Math.abs(Math.sin(ph)) * 26 : 0;
  const footL = walking ? legPose(hipL, aL, liftL + tuck) : {x: -22, y: -6};
  const footR = walking ? legPose(hipR, aR, liftR + tuck) : {x: 22, y: -6};
  const bendL = walking ? -8 - liftL * 0.9 - tuck * 0.6 : -4;
  const bendR = walking ? -8 - liftR * 0.9 - tuck * 0.6 : 4;

  const shoulderY = -206;
  const sB: Pt = {x: -24, y: shoulderY};
  const sF: Pt = {x: 24, y: shoulderY};

  let hB: Pt;
  let hF: Pt;
  let bB = 10;
  let bF = -10;
  let fingerF = false;
  switch (pose) {
    case 'walk':
    case 'hop': {
      const armSwing = Math.sin(ph) * (hop ? 36 : 26);
      hB = {x: -40 + armSwing, y: -130 - Math.abs(armSwing) * (hop ? 0.9 : 0.2)};
      hF = {x: 42 - armSwing * 0.5, y: withSuitcase ? -122 : -130};
      bB = 10 + armSwing * 0.3;
      bF = -12;
      break;
    }
    case 'wonder':
      hB = {x: -82, y: -238};
      hF = withSuitcase ? {x: 44, y: -122} : {x: 82, y: -238};
      bB = -22;
      bF = withSuitcase ? -10 : 22;
      break;
    case 'reach':
      hB = {x: -46, y: -136};
      hF = {x: 104, y: -262};
      bB = 12;
      bF = 26;
      break;
    case 'shush':
      // Finger an die Lippen
      hB = {x: -44, y: -128};
      hF = {x: 12, y: -226};
      bB = 10;
      bF = 30;
      fingerF = true;
      break;
    case 'hips':
      hB = {x: -40, y: -158};
      hF = {x: 40, y: -158};
      bB = -26;
      bF = 26;
      break;
    case 'map':
      hB = {x: -34, y: -176};
      hF = {x: 46, y: -176};
      bB = 16;
      bF = -16;
      break;
    case 'heart':
      hB = {x: -44, y: -128};
      hF = {x: 2, y: -190};
      bB = 10;
      bF = 20;
      break;
    case 'wave':
      hB = {x: -44, y: -128};
      hF = {x: 70, y: -290};
      bB = 10;
      bF = 20;
      break;
    default:
      hB = {x: -44, y: -128};
      hF = {x: 44, y: -124};
  }
  if (hbOverride) hB = hbOverride;
  if (hfOverride) hF = hfOverride;

  const braidSwing = walking ? ph : 0;
  const look = {x: lookX, y: lookY};
  const k = (n: string) => `${id}-${n}`;
  const cw = capeWind + (walking ? Math.sin(ph * 2) * 4 : 0);

  return (
    <g transform={`scale(${facing},1)`}>
      <ellipse cx={0} cy={2} rx={Math.max(20, 58 + bob * 0.8)} ry={9} fill={palette.ink} opacity={0.13} />
      <g transform={`translate(${sway},${bob}) scale(${1 / squash},${squash})`}>
        {/* Umhang hinten */}
        <g transform={`rotate(${cw * 0.5},0,-214)`}>
          <Rough
            shape={{kind: 'path', d: `M-30,-214 C-50,-190 ${-62 - cw},-150 ${-58 - cw * 1.4},-140 Q-40,-134 -26,-150 Q-10,-136 0,-150 C10,-170 20,-200 28,-214 Z`}}
            salt={k('cape')}
            fill={palette.salbei}
            wash={palette.salbei}
            washOpacity={0.55}
            hachureGap={5}
            hachureAngle={40}
            strokeWidth={2.6}
          />
        </g>
        <HoseLimb from={hipL} to={{x: footL.x, y: footL.y - bob}} bend={bendL} thickness={12} salt={k('legL')} />
        <HoseLimb from={hipR} to={{x: footR.x, y: footR.y - bob}} bend={bendR} thickness={12} salt={k('legR')} />
        <Shoe at={{x: footL.x, y: footL.y - bob}} tilt={walking ? aL * 0.6 : 0} salt={k('shoeL')} />
        <Shoe at={{x: footR.x, y: footR.y - bob}} tilt={walking ? aR * 0.6 : 0} salt={k('shoeR')} />

        <HoseLimb from={sB} to={hB} bend={bB} thickness={12} color={palette.skin} salt={k('armB')} />
        <Hand at={hB} salt={k('handB')} />

        {/* Kleid: schlicht, A-Linie, rosa Schraffur */}
        <Rough
          shape={{kind: 'path', d: 'M-26,-214 C-34,-180 -56,-140 -68,-112 Q-34,-104 0,-110 Q34,-104 68,-112 C56,-140 34,-180 26,-214 Q0,-222 -26,-214 Z'}}
          salt={k('dress')}
          fill={palette.rosa}
          wash={palette.rosa}
          washOpacity={0.5}
          hachureGap={5}
          hachureAngle={-50}
          strokeWidth={2.8}
        />
        <Rough shape={{kind: 'path', d: 'M-36,-170 Q0,-160 36,-170'}} salt={k('belt')} stroke={palette.rosenrot} strokeWidth={4} />
        {/* Kurzer Umhang vorne über den Schultern + Schleife */}
        <Rough
          shape={{kind: 'path', d: 'M-32,-216 C-44,-196 -46,-182 -40,-176 Q-20,-184 0,-190 Q20,-184 40,-176 C46,-182 44,-196 32,-216 Q0,-226 -32,-216 Z'}}
          salt={k('capelet')}
          fill={palette.salbei}
          wash={palette.salbei}
          washOpacity={0.6}
          hachureGap={4}
          hachureAngle={40}
          strokeWidth={2.6}
        />
        <Rough shape={{kind: 'path', d: 'M0,-212 C-12,-222 -16,-206 -2,-208 M0,-212 C12,-222 16,-206 2,-208 M-2,-208 L-6,-196 M2,-208 L6,-196'}} salt={k('tie')} stroke={palette.rosenrot} strokeWidth={2.4} />

        <HoseLimb from={sF} to={hF} bend={bF} thickness={12} color={palette.skin} salt={k('armF')} />
        {withSuitcase ? (
          <g transform={`translate(${hF.x},${hF.y})`}>
            <Suitcase id={k('case')} swing={walking ? Math.sin(ph) * (hop ? 12 : 5) : 0} />
          </g>
        ) : null}
        {holding ? <g transform={`translate(${hF.x},${hF.y})`}>{holding}</g> : null}

        <Rough shape={{kind: 'line', x1: -6, y1: -216, x2: -6, y2: -232}} salt={k('neckL')} strokeWidth={2.2} />
        <Rough shape={{kind: 'line', x1: 6, y1: -216, x2: 6, y2: -232}} salt={k('neckR')} strokeWidth={2.2} />
        <g transform={`translate(${KARIMA_HEAD.x},${KARIMA_HEAD.y}) rotate(${headTilt + sway * 0.6})`}>
          <Head expression={expression} blink={blink} look={look} braidSwing={braidSwing} id={id} />
        </g>
        {/* Hand vor dem Gesicht beim "Psst" */}
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
