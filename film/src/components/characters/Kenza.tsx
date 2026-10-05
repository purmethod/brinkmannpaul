import React from 'react';
import {palette} from '../../theme';
import {Rough} from '../rough/Rough';
import {Suitcase} from '../props/Suitcase';
import {HoseLimb} from './HoseLimb';

export type KenzaPose = 'stand' | 'walk' | 'wonder' | 'reach';
export type KenzaExpression = 'happy' | 'wonder' | 'curious';

export type KenzaProps = {
  pose?: KenzaPose;
  expression?: KenzaExpression;
  /** 0 = offen, 1 = geschlossen. */
  blink?: number;
  /** Gangphase 0..1 (ein voller Doppelschritt). Nur bei pose="walk". */
  walkCycle?: number;
  /** 1 = schaut nach rechts, -1 = nach links. */
  facing?: 1 | -1;
  /** Blickrichtung der Pupillen (-1..1). */
  lookX?: number;
  lookY?: number;
  /** Kopfneigung in Grad. */
  headTilt?: number;
  /** Koffer in der vorderen Hand. */
  withSuitcase?: boolean;
  /** Eindeutiger Name für die Boil-Seeds (bei mehreren Instanzen). */
  id?: string;
};

/** Kopfmittelpunkt relativ zum Fußpunkt — für Kamera/Iris-Ziele. */
export const KENZA_HEAD = {x: 0, y: -292};
export const KENZA_HEIGHT = 370;

const TAU = Math.PI * 2;
const deg = (d: number) => (d * Math.PI) / 180;

type Pt = {x: number; y: number};

const legPose = (hip: Pt, angle: number, lift: number, len: number): Pt => ({
  x: hip.x + Math.sin(deg(angle)) * len,
  y: hip.y + Math.cos(deg(angle)) * len - lift,
});

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
    <Rough shape={{kind: 'line', x1: -2, y1: -11, x2: 8, y2: -12}} salt={`${salt}-strap`} strokeWidth={2} />
  </g>
);

const Hand: React.FC<{at: Pt; salt: string}> = ({at, salt}) => (
  <g transform={`translate(${at.x},${at.y})`}>
    <Rough
      shape={{kind: 'circle', cx: 0, cy: 0, d: 20}}
      salt={`${salt}-hand`}
      fill={palette.skin}
      fillStyle="solid"
      strokeWidth={2.2}
    />
    <Rough shape={{kind: 'path', d: 'M-6,-6 Q-12,-12 -6,-14'}} salt={`${salt}-thumb`} strokeWidth={1.8} />
  </g>
);

const Eye: React.FC<{
  x: number;
  blink: number;
  look: Pt;
  wide: boolean;
  salt: string;
}> = ({x, blink, look, wide, salt}) => {
  const w = wide ? 36 : 32;
  const h = (wide ? 50 : 44) * Math.max(0.08, 1 - blink);
  if (blink > 0.85) {
    // Geschlossenes Lid: fröhlicher Bogen
    return (
      <Rough
        shape={{kind: 'path', d: `M${x - 15},${4} Q${x},${16} ${x + 15},${4}`}}
        salt={`${salt}-lid`}
        strokeWidth={3}
      />
    );
  }
  const pw = wide ? 17 : 15;
  const ph = Math.min(h * 0.55, wide ? 24 : 21);
  const px = x + look.x * (w / 2 - pw / 2 - 2);
  const py = 4 + look.y * (h / 2 - ph / 2 - 2) + 4;
  return (
    <g>
      <Rough
        shape={{kind: 'ellipse', cx: x, cy: 4, w, h}}
        salt={`${salt}-white`}
        fill="#FBF6EA"
        fillStyle="solid"
        strokeWidth={2.6}
      />
      <ellipse cx={px} cy={py} rx={pw / 2} ry={ph / 2} fill={palette.ink} />
      <ellipse cx={px - pw * 0.18} cy={py - ph * 0.22} rx={pw * 0.17} ry={ph * 0.15} fill="#FBF6EA" />
    </g>
  );
};

const Head: React.FC<{
  expression: KenzaExpression;
  blink: number;
  look: Pt;
  braidSwing: number;
  id: string;
}> = ({expression, blink, look, braidSwing, id}) => {
  const s = (n: string) => `${id}-head-${n}`;
  const wide = expression === 'wonder';
  const browLift = expression === 'wonder' ? -8 : expression === 'curious' ? -3 : 0;

  // Zopf hängt am Hinterkopf (links, da Figur nach rechts schaut)
  const braid: React.ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const bx = -62 - i * 3 + Math.sin(braidSwing + i * 0.5) * i * 2.4;
    const by = 6 + i * 21;
    braid.push(
      <Rough
        key={i}
        shape={{kind: 'ellipse', cx: bx, cy: by, w: 24 - t * 6, h: 26}}
        salt={s(`braid${i}`)}
        fill={palette.hair}
        fillStyle="cross-hatch"
        hachureGap={3.2}
        fillWeight={1.3}
        strokeWidth={2.2}
      />,
    );
  }
  const tipX = -74 + Math.sin(braidSwing + 2.5) * 10;
  const tipY = 110;

  return (
    <g>
      {braid}
      {/* Schleife am Zopfende */}
      <g transform={`translate(${tipX},${tipY - 10})`}>
        <Rough
          shape={{kind: 'path', d: 'M0,0 C-14,-12 -20,6 -4,4 Z M0,0 C14,-12 20,6 4,4 Z'}}
          salt={s('bow')}
          fill={palette.rosenrot}
          wash={palette.rosenrot}
          washOpacity={0.5}
          hachureGap={3}
          strokeWidth={2}
        />
      </g>
      <Rough
        shape={{kind: 'path', d: `M${tipX - 4},${tipY - 4} L${tipX - 8},${tipY + 12} M${tipX},${tipY - 4} L${tipX},${tipY + 14} M${tipX + 4},${tipY - 4} L${tipX + 7},${tipY + 11}`}}
        salt={s('tuft')}
        strokeWidth={2}
      />

      {/* Haar-Masse hinter dem Gesicht */}
      <Rough
        shape={{kind: 'path', d: 'M-70,20 C-82,-40 -60,-84 0,-86 C60,-84 82,-40 70,18 C64,-20 50,-50 0,-52 C-50,-50 -64,-20 -70,20 Z'}}
        salt={s('hairback')}
        fill={palette.hair}
        fillStyle="cross-hatch"
        hachureGap={3.4}
        fillWeight={1.4}
        strokeWidth={2.6}
      />

      {/* Ohren + Ohrringe */}
      {[-1, 1].map((side) => (
        <g key={side}>
          <Rough
            shape={{kind: 'ellipse', cx: side * 64, cy: 12, w: 18, h: 24}}
            salt={s(`ear${side}`)}
            fill={palette.skin}
            fillStyle="solid"
            strokeWidth={2.2}
          />
          <Rough shape={{kind: 'line', x1: side * 65, y1: 24, x2: side * 65, y2: 31}} salt={s(`ering-l${side}`)} strokeWidth={1.6} />
          <Rough
            shape={{kind: 'circle', cx: side * 65, cy: 36, d: 10}}
            salt={s(`ering${side}`)}
            fill={palette.senf}
            wash={palette.senf}
            washOpacity={0.8}
            hachureGap={2.5}
            strokeWidth={1.8}
          />
        </g>
      ))}

      {/* Gesicht */}
      <Rough
        shape={{kind: 'path', d: 'M-62,-10 C-66,40 -36,66 0,66 C36,66 66,40 62,-10 C58,-46 34,-60 0,-60 C-34,-60 -58,-46 -62,-10 Z'}}
        salt={s('face')}
        fill={palette.skin}
        fillStyle="solid"
        strokeWidth={2.8}
      />

      {/* Pony (schraffiert), gewellte Unterkante */}
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
      {/* Glanzlicht im Haar */}
      <Rough
        shape={{kind: 'path', d: 'M-30,-58 Q-10,-66 12,-62'}}
        salt={s('shine')}
        stroke="#FBF6EA"
        strokeWidth={4}
        multiStroke={false}
      />

      {/* Augenbrauen */}
      <Rough shape={{kind: 'path', d: `M-38,${-12 + browLift} Q-26,${-20 + browLift} -14,${-14 + browLift}`}} salt={s('browL')} strokeWidth={2.6} />
      <Rough shape={{kind: 'path', d: `M14,${-14 + browLift} Q26,${-20 + browLift} 38,${-12 + browLift}`}} salt={s('browR')} strokeWidth={2.6} />

      <Eye x={-25} blink={blink} look={look} wide={wide} salt={s('eyeL')} />
      <Eye x={25} blink={blink} look={look} wide={wide} salt={s('eyeR')} />

      {/* Wangen */}
      {[-1, 1].map((side) => (
        <Rough
          key={side}
          shape={{kind: 'circle', cx: side * 42, cy: 36, d: 20}}
          salt={s(`cheek${side}`)}
          stroke="transparent"
          fill={palette.rosa}
          wash={palette.rosa}
          washOpacity={0.55}
          hachureGap={3.2}
          hachureAngle={30}
        />
      ))}

      {/* Nase */}
      <Rough shape={{kind: 'path', d: 'M-3,26 Q2,32 6,26'}} salt={s('nose')} strokeWidth={2.2} />

      {/* Mund */}
      {expression === 'wonder' ? (
        <Rough
          shape={{kind: 'ellipse', cx: 0, cy: 46, w: 16, h: 20}}
          salt={s('mouthO')}
          fill={palette.rosenrot}
          wash={palette.ink}
          washOpacity={0.55}
          hachureGap={3}
          strokeWidth={2.6}
        />
      ) : expression === 'curious' ? (
        <Rough
          shape={{kind: 'path', d: 'M-18,40 C-8,54 14,52 24,36 C14,44 -4,46 -18,40 Z'}}
          salt={s('mouthC')}
          fill={palette.rosenrot}
          wash={palette.rosenrot}
          washOpacity={0.4}
          hachureGap={3}
          strokeWidth={2.6}
        />
      ) : (
        <Rough
          shape={{kind: 'path', d: 'M-28,36 C-20,64 20,64 28,36 C14,44 -14,44 -28,36 Z'}}
          salt={s('mouthH')}
          fill={palette.rosenrot}
          wash={palette.rosenrot}
          washOpacity={0.45}
          hachureGap={3}
          strokeWidth={2.8}
        />
      )}
    </g>
  );
};

/**
 * Kenza — zierliche Rubber-Hose-Heldin: großer runder Kopf, dunkles Haar mit
 * Pony und Zopf, Ohrringe, großes Lächeln, schlauchartige Arme und Beine.
 * Ursprung (0,0) = Mitte zwischen den Füßen auf dem Boden.
 */
export const Kenza: React.FC<KenzaProps> = ({
  pose = 'stand',
  expression = 'happy',
  blink = 0,
  walkCycle = 0,
  facing = 1,
  lookX = 0.3,
  lookY = 0,
  headTilt = 0,
  withSuitcase = false,
  id = 'kenza',
}) => {
  const walking = pose === 'walk';
  const ph = walkCycle * TAU;

  // Federnder Gang: Körper hüpft bei jedem Schritt, staucht leicht
  const bob = walking ? -Math.abs(Math.sin(ph)) * 16 : 0;
  const squash = walking ? 1 + Math.cos(ph * 2) * 0.03 : 1;
  const sway = walking ? Math.sin(ph) * 3 : 0;

  const hipY = -118;
  const legLen = 112;
  const hipL: Pt = {x: -14, y: hipY};
  const hipR: Pt = {x: 14, y: hipY};

  const swing = walking ? 25 : 0;
  const aL = Math.sin(ph) * swing;
  const aR = -Math.sin(ph) * swing;
  const liftL = walking ? Math.max(0, Math.cos(ph)) * 22 : 0;
  const liftR = walking ? Math.max(0, -Math.cos(ph)) * 22 : 0;
  const footL = walking ? legPose(hipL, aL, liftL, legLen) : {x: -22, y: -6};
  const footR = walking ? legPose(hipR, aR, liftR, legLen) : {x: 22, y: -6};
  // Beine biegen sich wie Gummischläuche (vorwärts beim Anheben)
  const bendL = walking ? -8 - liftL * 0.9 : -4;
  const bendR = walking ? -8 - liftR * 0.9 : 4;

  const shoulderY = -206;
  const shoulderBack: Pt = {x: -24, y: shoulderY};
  const shoulderFront: Pt = {x: 24, y: shoulderY};

  // Arme
  let handBack: Pt;
  let handFront: Pt;
  let bendBack: number;
  let bendFront: number;
  if (pose === 'walk') {
    const armSwing = Math.sin(ph) * 26;
    handBack = {x: -40 + armSwing, y: -130 - Math.abs(armSwing) * 0.2};
    handFront = {x: 42 - armSwing * 0.5, y: withSuitcase ? -122 : -130};
    bendBack = 10 + armSwing * 0.3;
    bendFront = -12;
  } else if (pose === 'wonder') {
    handBack = {x: -82, y: -238};
    handFront = withSuitcase ? {x: 44, y: -122} : {x: 82, y: -238};
    bendBack = -22;
    bendFront = withSuitcase ? -10 : 22;
  } else if (pose === 'reach') {
    handBack = {x: -46, y: -136};
    handFront = {x: 104, y: -262};
    bendBack = 12;
    bendFront = 26;
  } else {
    handBack = {x: -44, y: -128};
    handFront = {x: 44, y: -124};
    bendBack = 10;
    bendFront = -10;
  }

  const braidSwing = walking ? ph : 0;
  const look = {x: lookX, y: lookY};
  const k = (n: string) => `${id}-${n}`;

  return (
    <g transform={`scale(${facing},1)`}>
      {/* Schatten */}
      <ellipse cx={0} cy={2} rx={58 + bob * 0.8} ry={9} fill={palette.ink} opacity={0.13} />
      <g transform={`translate(${sway},${bob}) scale(${1 / squash},${squash})`}>
        {/* Beine */}
        <HoseLimb from={hipL} to={{x: footL.x, y: footL.y - bob}} bend={bendL} thickness={12} salt={k('legL')} />
        <HoseLimb from={hipR} to={{x: footR.x, y: footR.y - bob}} bend={bendR} thickness={12} salt={k('legR')} />
        <Shoe at={{x: footL.x, y: footL.y - bob}} tilt={walking ? aL * 0.6 : 0} salt={k('shoeL')} />
        <Shoe at={{x: footR.x, y: footR.y - bob}} tilt={walking ? aR * 0.6 : 0} salt={k('shoeR')} />

        {/* Hinterer Arm (hinter dem Kleid) */}
        <HoseLimb from={shoulderBack} to={handBack} bend={bendBack} thickness={12} color={palette.skin} salt={k('armB')} />
        <Hand at={handBack} salt={k('handB')} />

        {/* Kleid: A-Linie, rosa Buntstift-Schraffur, Rüschensaum */}
        <Rough
          shape={{kind: 'path', d: 'M-26,-214 C-34,-180 -58,-140 -72,-112 Q-60,-104 -48,-112 Q-36,-102 -24,-112 Q-12,-102 0,-112 Q12,-102 24,-112 Q36,-102 48,-112 Q60,-104 72,-112 C58,-140 34,-180 26,-214 Q0,-222 -26,-214 Z'}}
          salt={k('dress')}
          fill={palette.rosa}
          wash={palette.rosa}
          washOpacity={0.5}
          hachureGap={5}
          hachureAngle={-50}
          strokeWidth={2.8}
        />
        {/* Kragen */}
        <Rough
          shape={{kind: 'path', d: 'M-24,-214 Q-14,-196 0,-208 Q14,-196 24,-214'}}
          salt={k('collar')}
          strokeWidth={2.4}
          fill="#FBF6EA"
          fillStyle="solid"
        />
        {/* Gürtel */}
        <Rough
          shape={{kind: 'path', d: 'M-36,-170 Q0,-160 36,-170'}}
          salt={k('belt')}
          stroke={palette.rosenrot}
          strokeWidth={4}
        />
        {/* Punkte auf dem Kleid */}
        {[
          [-30, -138],
          [8, -146],
          [38, -128],
          [-8, -128],
          [-18, -186],
          [18, -184],
        ].map(([x, y], i) => (
          <Rough
            key={i}
            shape={{kind: 'circle', cx: x, cy: y, d: 7}}
            salt={k(`dot${i}`)}
            stroke={palette.rosenrot}
            strokeWidth={1.6}
            fill={palette.rosenrot}
            fillStyle="solid"
          />
        ))}

        {/* Vorderer Arm */}
        <HoseLimb from={shoulderFront} to={handFront} bend={bendFront} thickness={12} color={palette.skin} salt={k('armF')} />
        {withSuitcase ? (
          <g transform={`translate(${handFront.x},${handFront.y})`}>
            <Suitcase id={k('case')} swing={walking ? Math.sin(ph) * 5 : 0} />
          </g>
        ) : null}
        <Hand at={handFront} salt={k('handF')} />

        {/* Hals + Kopf */}
        <Rough shape={{kind: 'line', x1: -6, y1: -216, x2: -6, y2: -232}} salt={k('neckL')} strokeWidth={2.2} />
        <Rough shape={{kind: 'line', x1: 6, y1: -216, x2: 6, y2: -232}} salt={k('neckR')} strokeWidth={2.2} />
        <g transform={`translate(${KENZA_HEAD.x},${KENZA_HEAD.y}) rotate(${headTilt + sway * 0.6})`}>
          <Head expression={expression} blink={blink} look={look} braidSwing={braidSwing} id={id} />
        </g>
      </g>
    </g>
  );
};

/** Blinzeln: kurze Lidschläge zu festen Zeitpunkten (Frames). */
export const blinkAt = (frame: number, at: number[], length = 6) => {
  for (const b of at) {
    const t = frame - b;
    if (t >= 0 && t < length) {
      return Math.sin((t / (length - 1)) * Math.PI);
    }
  }
  return 0;
};
