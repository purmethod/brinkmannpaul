import React from 'react';
import {useCurrentFrame} from 'remotion';
import {palette} from '../theme';
import {Heart} from './DoodleFX';
import {Rough} from './Rough';
import {Rose} from './Vines';

/** Laib Brot (Kritzel). Ursprung = Mitte. */
export const Bread: React.FC<{x: number; y: number; size?: number; crossed?: number; id?: string}> = ({x, y, size = 1, crossed = 0, id = 'bread'}) => (
  <g transform={`translate(${x},${y}) scale(${size})`}>
    <Rough
      shape={{kind: 'path', d: 'M-70,20 C-80,-30 -30,-50 0,-48 C30,-50 80,-30 70,20 Z'}}
      salt={`${id}-loaf`}
      fill={palette.senf}
      wash={palette.wood}
      washOpacity={0.35}
      hachureGap={4}
      strokeWidth={2.6}
    />
    <Rough shape={{kind: 'path', d: 'M-36,-30 l14,24 M-6,-38 l14,26 M24,-34 l14,24'}} salt={`${id}-cuts`} strokeWidth={2.2} />
    {crossed > 0 ? (
      <Rough shape={{kind: 'path', d: 'M-90,-60 L90,40 M90,-60 L-90,40'}} salt={`${id}-x`} stroke={palette.rosenrot} strokeWidth={7} draw={crossed} multiStroke={false} />
    ) : null}
  </g>
);

/** Bäckerei-Häuschen mit Brezel-Schild und Markise. Ursprung = Fußpunkt Mitte. draw 0..1. */
export const Bakery: React.FC<{x: number; y: number; scale?: number; draw?: number; doorOpen?: number; id?: string}> = ({
  x,
  y,
  scale = 1,
  draw = 1,
  doorOpen = 0,
  id = 'bakery',
}) => {
  if (draw <= 0) return null;
  const d = (o: number) => Math.min(1, Math.max(0, draw * 1.5 - o));
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <Rough shape={{kind: 'polygon', points: [[-200, 0], [200, 0], [190, -380], [-196, -380]]}} salt={`${id}-wall`} base={palette.paper} fill={palette.rosa} hachureGap={8} strokeWidth={3} draw={d(0)} />
      <Rough shape={{kind: 'polygon', points: [[-230, -376], [226, -380], [0, -560]]}} salt={`${id}-roof`} base={palette.paper} fill={palette.rosenrot} hachureGap={5} strokeWidth={3} draw={d(0.2)} />
      {/* Fachwerk */}
      <Rough shape={{kind: 'path', d: 'M-196,-250 L190,-252 M-100,-380 L-100,-250 M100,-380 L100,-252 M-196,-380 L-100,-250 M100,-252 L190,-380'}} salt={`${id}-beams`} stroke={palette.woodDark} strokeWidth={5} draw={d(0.3)} />
      {/* Markise */}
      <Rough
        shape={{kind: 'path', d: 'M-180,-230 L180,-230 L200,-180 Q170,-160 140,-180 Q110,-160 80,-180 Q50,-160 20,-180 Q-10,-160 -40,-180 Q-70,-160 -100,-180 Q-130,-160 -160,-180 Q-190,-160 -200,-180 Z'}}
        salt={`${id}-awning`}
        base={palette.paper}
        fill={palette.salbei}
        hachureGap={6}
        hachureAngle={90}
        strokeWidth={2.6}
        draw={d(0.4)}
      />
      {/* Schaufenster mit Broten */}
      <Rough shape={{kind: 'rect', x: -170, y: -150, w: 150, h: 110}} salt={`${id}-shop`} base={palette.white} fill={palette.senf} hachureGap={9} strokeWidth={2.6} draw={d(0.5)} />
      {d(0.6) > 0 ? (
        <g>
          <Bread x={-130} y={-70} size={0.35} id={`${id}-b1`} />
          <Bread x={-60} y={-70} size={0.35} id={`${id}-b2`} />
        </g>
      ) : null}
      {/* Tür */}
      <Rough shape={{kind: 'path', d: 'M30,0 L30,-150 Q90,-200 150,-150 L150,0 Z'}} salt={`${id}-doorframe`} base={'#4a382b'} strokeWidth={2.8} draw={d(0.5)} />
      <g transform={`translate(30,0) scale(${1 - doorOpen * 0.8},1)`}>
        <Rough shape={{kind: 'path', d: 'M0,0 L0,-150 Q60,-200 120,-150 L120,0 Z'}} salt={`${id}-door`} base={palette.paper} fill={palette.wood} hachureGap={5} strokeWidth={2.6} draw={d(0.5)} />
      </g>
      {/* Brezel-Schild am Ausleger */}
      <Rough shape={{kind: 'path', d: 'M190,-330 L290,-330 M240,-330 L240,-310'}} salt={`${id}-arm`} stroke={palette.woodDark} strokeWidth={5} draw={d(0.6)} />
      <Rough
        shape={{kind: 'path', d: 'M240,-310 C200,-310 196,-250 236,-262 C250,-266 230,-296 240,-306 C250,-296 230,-266 244,-262 C284,-250 280,-310 240,-310 Z'}}
        salt={`${id}-pretzel`}
        stroke={palette.wood}
        strokeWidth={7}
        draw={d(0.7)}
        multiStroke={false}
      />
    </g>
  );
};

/** Pavillon (Rundtempel) vor dem Schloss. Ursprung = Boden Mitte. */
export const Pavilion: React.FC<{x: number; y: number; scale?: number; id?: string}> = ({x, y, scale = 1, id = 'pav'}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <Rough shape={{kind: 'ellipse', cx: 0, cy: 0, w: 520, h: 70}} salt={`${id}-floor`} base={palette.paperDark} fill={palette.inkSoft} hachureGap={10} strokeWidth={2.6} />
    {[-220, -110, 0, 110, 220].map((px, i) => (
      <Rough key={i} shape={{kind: 'rect', x: px - 14, y: -420, w: 28, h: 420 - Math.abs(px) * 0.08}} salt={`${id}-col${i}`} base={palette.white} strokeWidth={2.6} />
    ))}
    <Rough shape={{kind: 'path', d: 'M-270,-410 Q0,-470 270,-410 L250,-440 Q0,-640 -250,-440 Z'}} salt={`${id}-dome`} base={palette.paper} fill={palette.salbei} hachureGap={6} strokeWidth={3} />
    <Rough shape={{kind: 'path', d: 'M0,-600 L0,-660 M-12,-648 L12,-648'}} salt={`${id}-tip`} strokeWidth={3} />
  </g>
);

/** Taschenuhr; `spin` dreht die Zeiger (Umdrehungen). Ursprung = Mitte. */
export const PocketWatch: React.FC<{x: number; y: number; size?: number; spin?: number; id?: string}> = ({x, y, size = 1, spin = 0, id = 'watch'}) => {
  const frame = useCurrentFrame();
  const a = spin * 360;
  return (
    <g transform={`translate(${x},${y}) scale(${size})`}>
      <Rough shape={{kind: 'path', d: 'M0,-46 Q-6,-70 10,-74'}} salt={`${id}-chain`} stroke={palette.senf} strokeWidth={3} />
      <Rough shape={{kind: 'circle', cx: 0, cy: 0, d: 92}} salt={`${id}-case`} base={palette.white} fill={palette.senf} hachureGap={7} strokeWidth={3} />
      <Rough shape={{kind: 'circle', cx: 0, cy: 0, d: 72}} salt={`${id}-face`} strokeWidth={1.6} />
      <line x1={0} y1={0} x2={Math.sin((a * Math.PI) / 180) * 26} y2={-Math.cos((a * Math.PI) / 180) * 26} stroke={palette.ink} strokeWidth={4} strokeLinecap="round" />
      <line x1={0} y1={0} x2={Math.sin(((a / 12 + frame * 0.2) * Math.PI) / 180) * 18} y2={-Math.cos(((a / 12 + frame * 0.2) * Math.PI) / 180) * 18} stroke={palette.rosenrot} strokeWidth={4} strokeLinecap="round" />
      <circle r={4} fill={palette.ink} />
    </g>
  );
};

/** Kritzel-Sonne mit Strahlen und Gesicht. */
export const Sun: React.FC<{x: number; y: number; size?: number; id?: string}> = ({x, y, size = 1, id = 'sun'}) => {
  const frame = useCurrentFrame();
  return (
    <g transform={`translate(${x},${y}) scale(${size}) rotate(${frame * 1.5})`}>
      {Array.from({length: 12}).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <Rough key={i} shape={{kind: 'line', x1: Math.cos(a) * 70, y1: Math.sin(a) * 70, x2: Math.cos(a) * 100, y2: Math.sin(a) * 100}} salt={`${id}-ray${i}`} stroke={palette.senf} strokeWidth={4} />;
      })}
      <Rough shape={{kind: 'circle', cx: 0, cy: 0, d: 120}} salt={`${id}-disc`} base={palette.paper} fill={palette.senf} hachureGap={5} strokeWidth={2.6} />
      <circle cx={-18} cy={-8} r={5} fill={palette.ink} />
      <circle cx={18} cy={-8} r={5} fill={palette.ink} />
      <Rough shape={{kind: 'path', d: 'M-20,14 Q0,32 20,14'}} salt={`${id}-smile`} strokeWidth={3} />
    </g>
  );
};

/** Gasthaustisch mit zwei Hockern; Brot in der Mitte. Ursprung = Boden Mitte. */
export const InnTable: React.FC<{x: number; y: number; scale?: number; breadSplit?: number; id?: string}> = ({x, y, scale = 1, breadSplit = 0, id = 'inn'}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <Rough shape={{kind: 'path', d: 'M-150,-170 L-140,0 M150,-170 L140,0'}} salt={`${id}-legs`} stroke={palette.woodDark} strokeWidth={8} />
    <Rough shape={{kind: 'rect', x: -200, y: -190, w: 400, h: 30}} salt={`${id}-top`} base={palette.paper} fill={palette.wood} hachureGap={5} strokeWidth={2.8} />
    <g transform={`translate(${-breadSplit * 50},-215) rotate(${-breadSplit * 12})`}>
      <Bread x={0} y={0} size={0.45} id={`${id}-b1`} />
    </g>
    {breadSplit > 0 ? (
      <g transform={`translate(${breadSplit * 50},-215) rotate(${breadSplit * 12})`}>
        <Bread x={0} y={0} size={0.4} id={`${id}-b2`} />
      </g>
    ) : null}
    {/* zwei Krüge */}
    {[-140, 140].map((mx, i) => (
      <Rough key={i} shape={{kind: 'rect', x: mx - 18, y: -240, w: 36, h: 50}} salt={`${id}-mug${i}`} base={palette.white} fill={palette.senf} hachureGap={5} strokeWidth={2.2} />
    ))}
  </g>
);

/** Dampfender Kochtopf. */
export const CookingPot: React.FC<{x: number; y: number; size?: number; id?: string}> = ({x, y, size = 1, id = 'pot'}) => {
  const frame = useCurrentFrame();
  return (
    <g transform={`translate(${x},${y}) scale(${size})`}>
      {[0, 1, 2].map((i) => {
        const yy = -110 - ((frame * 2 + i * 30) % 90);
        return (
          <Rough key={i} shape={{kind: 'path', d: `M${-30 + i * 30},-70 C${-50 + i * 30},${yy + 40} ${-10 + i * 30},${yy + 20} ${-30 + i * 30},${yy}`}} salt={`${id}-steam${i}`} stroke={palette.inkSoft} strokeWidth={2.4} opacity={0.7} />
        );
      })}
      <Rough shape={{kind: 'path', d: 'M-100,-70 L100,-70 L86,10 Q0,30 -86,10 Z'}} salt={`${id}-body`} base={palette.paper} fill={palette.inkSoft} hachureGap={5} strokeWidth={3} />
      <Rough shape={{kind: 'path', d: 'M-100,-60 Q-130,-60 -126,-40 M100,-60 Q130,-60 126,-40'}} salt={`${id}-handles`} strokeWidth={4} />
      <Heart x={0} y={-30} size={30} color={palette.rosa} salt={`${id}-heart`} />
    </g>
  );
};

/** Korb mit Erdbeeren. */
export const StrawberryBasket: React.FC<{x: number; y: number; size?: number; id?: string}> = ({x, y, size = 1, id = 'basket'}) => (
  <g transform={`translate(${x},${y}) scale(${size})`}>
    <Rough shape={{kind: 'path', d: 'M-80,-60 Q0,-170 80,-60'}} salt={`${id}-handle`} stroke={palette.wood} strokeWidth={6} />
    {[-50, -16, 18, 50, -30, 6, 34].map((sx, i) => (
      <g key={i} transform={`translate(${sx},${i < 4 ? -64 : -84})`}>
        <Rough shape={{kind: 'path', d: 'M0,18 C-18,6 -16,-12 0,-12 C16,-12 18,6 0,18 Z'}} salt={`${id}-berry${i}`} fill={palette.rosenrot} wash={palette.rosenrot} washOpacity={0.6} hachureGap={3} strokeWidth={2} />
        <Rough shape={{kind: 'path', d: 'M-8,-12 L0,-18 L8,-12'}} salt={`${id}-leaf${i}`} stroke={palette.salbei} strokeWidth={3} />
      </g>
    ))}
    <Rough shape={{kind: 'path', d: 'M-90,-60 L90,-60 L70,20 L-70,20 Z'}} salt={`${id}-body`} base={palette.paper} fill={palette.wood} fillStyle="cross-hatch" hachureGap={8} strokeWidth={2.8} />
  </g>
);

/** Einladung/Umschlag mit rotem Siegel. */
export const Envelope: React.FC<{x: number; y: number; size?: number; rotation?: number; open?: number; id?: string}> = ({
  x,
  y,
  size = 1,
  rotation = 0,
  open = 0,
  id = 'env',
}) => (
  <g transform={`translate(${x},${y}) rotate(${rotation}) scale(${size})`}>
    <Rough shape={{kind: 'rect', x: -90, y: -60, w: 180, h: 120}} salt={`${id}-body`} base={palette.white} fill={palette.paperDark} hachureGap={10} strokeWidth={2.6} />
    <Rough shape={{kind: 'path', d: `M-90,-60 L0,${10 - open * 140} L90,-60`}} salt={`${id}-flap`} strokeWidth={2.4} />
    {open < 0.3 ? <Rough shape={{kind: 'circle', cx: 0, cy: 6, d: 34}} salt={`${id}-seal`} fill={palette.rosenrot} fillStyle="solid" strokeWidth={2} /> : null}
  </g>
);

/** Brief (gefaltetes Blatt mit Kritzelzeilen, ohne lesbaren Text). */
export const Letter: React.FC<{x: number; y: number; size?: number; rotation?: number; id?: string}> = ({x, y, size = 1, rotation = 0, id = 'letter'}) => (
  <g transform={`translate(${x},${y}) rotate(${rotation}) scale(${size})`}>
    <Rough shape={{kind: 'rect', x: -70, y: -90, w: 140, h: 180}} salt={`${id}-sheet`} base={palette.white} strokeWidth={2.4} />
    {[-60, -36, -12, 12, 36].map((ly, i) => (
      <Rough key={i} shape={{kind: 'path', d: `M-50,${ly} q12,-6 24,0 t24,0 t24,0 t24,0`}} salt={`${id}-l${i}`} stroke={palette.inkSoft} strokeWidth={1.6} />
    ))}
    <Heart x={36} y={66} size={26} salt={`${id}-heart`} />
  </g>
);

/** Märchenbuch mit Stern und Rose auf dem Umschlag (keine bekannte Figur). */
export const StarRoseBook: React.FC<{x: number; y: number; size?: number; rotation?: number; id?: string}> = ({x, y, size = 1, rotation = 0, id = 'srbook'}) => {
  const star: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? 40 : 16;
    star.push([Math.cos(a) * r, -60 + Math.sin(a) * r]);
  }
  return (
    <g transform={`translate(${x},${y}) rotate(${rotation}) scale(${size})`}>
      <Rough shape={{kind: 'rect', x: -120, y: -160, w: 240, h: 320}} salt={`${id}-cover`} base={palette.paper} fill={palette.nightBlue} hachureGap={5} strokeWidth={3} />
      <Rough shape={{kind: 'rect', x: -120, y: -160, w: 22, h: 320}} salt={`${id}-spine`} fill={palette.ink} hachureGap={4} strokeWidth={2} />
      <Rough shape={{kind: 'polygon', points: star}} salt={`${id}-star`} base={palette.paper} fill={palette.senf} hachureGap={3} strokeWidth={2.2} />
      <Rose x={0} y={60} size={1.6} salt={`${id}-rose`} />
      <Rough shape={{kind: 'path', d: 'M0,76 C-6,100 6,120 0,140'}} salt={`${id}-stem`} stroke={palette.salbei} strokeWidth={3} />
    </g>
  );
};

/** Innenansicht eines Fensters (Sprossen, Vorhänge). Ursprung = Mitte. Inhalt (draußen) als children, geclippt. */
export const WindowView: React.FC<{x: number; y: number; w?: number; h?: number; id?: string; children?: React.ReactNode}> = ({
  x,
  y,
  w = 520,
  h = 640,
  id = 'win',
  children,
}) => (
  <g transform={`translate(${x},${y})`}>
    <defs>
      <clipPath id={`${id}-clip`}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} />
      </clipPath>
    </defs>
    <g clipPath={`url(#${id}-clip)`}>{children}</g>
    <Rough shape={{kind: 'rect', x: -w / 2, y: -h / 2, w, h}} salt={`${id}-frame`} stroke={palette.woodDark} strokeWidth={10} multiStroke={false} />
    <Rough shape={{kind: 'path', d: `M0,${-h / 2} L0,${h / 2} M${-w / 2},0 L${w / 2},0`}} salt={`${id}-bars`} stroke={palette.woodDark} strokeWidth={8} multiStroke={false} />
    {/* Vorhänge */}
    <Rough shape={{kind: 'path', d: `M${-w / 2 - 40},${-h / 2 - 30} C${-w / 2 + 40},${-h / 4} ${-w / 2 - 10},${h / 4} ${-w / 2 + 30},${h / 2 + 30} L${-w / 2 - 60},${h / 2 + 30} Z`}} salt={`${id}-curtL`} base={palette.paper} fill={palette.rosa} hachureGap={6} hachureAngle={80} strokeWidth={2.6} />
    <Rough shape={{kind: 'path', d: `M${w / 2 + 40},${-h / 2 - 30} C${w / 2 - 40},${-h / 4} ${w / 2 + 10},${h / 4} ${w / 2 - 30},${h / 2 + 30} L${w / 2 + 60},${h / 2 + 30} Z`}} salt={`${id}-curtR`} base={palette.paper} fill={palette.rosa} hachureGap={6} hachureAngle={100} strokeWidth={2.6} />
    <Rough shape={{kind: 'rect', x: -w / 2 - 30, y: h / 2, w: w + 60, h: 26}} salt={`${id}-sill`} base={palette.paper} fill={palette.wood} hachureGap={5} strokeWidth={2.6} />
  </g>
);

/** Klopf-Wellen (Kreisbögen) an einer Stelle. t 0..1 je Klopfen. */
export const KnockWaves: React.FC<{x: number; y: number; t: number; id?: string}> = ({x, y, t, id = 'knock'}) => {
  if (t <= 0 || t >= 1) return null;
  return (
    <g opacity={1 - t}>
      {[0, 1, 2].map((i) => (
        <Rough key={i} shape={{kind: 'path', d: `M${x + 20 + i * 22 + t * 30},${y - 40 - i * 14} Q${x + 46 + i * 26 + t * 30},${y} ${x + 20 + i * 22 + t * 30},${y + 40 + i * 14}`}} salt={`${id}-${i}`} strokeWidth={3} />
      ))}
    </g>
  );
};

/** Farbstimmung über die ganze Szene (z. B. grau-blau, warmes Gold). amount 0..1. */
export const ColorWash: React.FC<{color: string; amount: number; blend?: 'multiply' | 'color' | 'soft-light'}> = ({color, amount, blend = 'multiply'}) =>
  amount > 0 ? <rect x={0} y={0} width={1080} height={1920} fill={color} opacity={amount} style={{mixBlendMode: blend}} /> : null;
