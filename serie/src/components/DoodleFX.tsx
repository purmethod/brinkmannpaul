import React from 'react';
import {useCurrentFrame} from 'remotion';
import {palette} from '../theme';
import {Rough} from './Rough';

export {Sparkle, QuestionMark} from './Sparkle';

/** Kritzel-Herz. */
export const Heart: React.FC<{x: number; y: number; size?: number; rotation?: number; color?: string; salt: string; draw?: number}> = ({
  x,
  y,
  size = 40,
  rotation = 0,
  color = palette.rosenrot,
  salt,
  draw = 1,
}) => {
  const s = size / 40;
  return (
    <g transform={`translate(${x},${y}) rotate(${rotation}) scale(${s})`}>
      <Rough
        shape={{kind: 'path', d: 'M0,14 C-26,-4 -22,-26 -8,-24 C-2,-23 0,-18 0,-14 C0,-18 2,-23 8,-24 C22,-26 26,-4 0,14 Z'}}
        salt={salt}
        fill={color}
        wash={color}
        washOpacity={0.55}
        hachureGap={3}
        strokeWidth={2}
        draw={draw}
      />
    </g>
  );
};

/** Gedankenblase mit kleinen Kreisen zum Kopf; Inhalt als children (lokal um 0,0). */
export const ThoughtBubble: React.FC<{
  x: number;
  y: number;
  /** Punkt, aus dem die Blase aufsteigt (z. B. Kopf). */
  fromX: number;
  fromY: number;
  w?: number;
  h?: number;
  appear?: number;
  id: string;
  children?: React.ReactNode;
}> = ({x, y, fromX, fromY, w = 260, h = 190, appear = 1, id, children}) => {
  if (appear <= 0) return null;
  const pts: [number, number][] = [];
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([Math.cos(a) * w * 0.5, Math.sin(a) * h * 0.5]);
  }
  // Wolkenrand aus Bögen
  let d = '';
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % n];
    const mx = (p[0] + q[0]) / 2;
    const my = (p[1] + q[1]) / 2;
    const bulge = 1.28;
    if (i === 0) d += `M${p[0]},${p[1]} `;
    d += `Q${mx * bulge},${my * bulge} ${q[0]},${q[1]} `;
  });
  const sc = Math.min(1, appear * 1.3);
  return (
    <g>
      {[0.25, 0.5, 0.72].map((t, i) =>
        appear > t * 0.6 ? (
          <Rough
            key={i}
            shape={{kind: 'circle', cx: fromX + (x - fromX) * t, cy: fromY + (y + h * 0.4 - fromY) * t, d: 14 + i * 10}}
            salt={`${id}-dot${i}`}
            base={palette.white}
            strokeWidth={2}
          />
        ) : null,
      )}
      <g transform={`translate(${x},${y}) scale(${sc})`}>
        <Rough shape={{kind: 'path', d}} salt={`${id}-cloud`} base={palette.white} strokeWidth={2.6} />
        {children}
      </g>
    </g>
  );
};

/** Vogelschwarm, der auffliegt (t 0..1). */
export const Birds: React.FC<{x: number; y: number; t: number; count?: number; spread?: number; id?: string}> = ({
  x,
  y,
  t,
  count = 7,
  spread = 1,
  id = 'birds',
}) => {
  const frame = useCurrentFrame();
  if (t <= 0 || t >= 1.4) return null;
  return (
    <g>
      {Array.from({length: count}).map((_, i) => {
        const dx = (i - count / 2) * 40 * spread + t * (200 + i * 60) * (i % 2 ? 1 : -0.6);
        const dy = -t * (500 + i * 90) + Math.sin(i * 2.1) * 30;
        const flap = Math.sin(frame * 0.8 + i) * 10;
        const s = 0.8 + (i % 3) * 0.2;
        return (
          <g key={i} transform={`translate(${x + dx},${y + dy}) scale(${s})`}>
            <Rough shape={{kind: 'path', d: `M-18,${flap} Q-8,-6 0,2 Q8,-6 18,${flap}`}} salt={`${id}-${i}`} strokeWidth={3} />
          </g>
        );
      })}
    </g>
  );
};

/** Rauchwölkchen (Verpuffen / Ankunft). t 0..1. */
export const Puff: React.FC<{x: number; y: number; t: number; size?: number; id?: string}> = ({x, y, t, size = 1, id = 'puff'}) => {
  if (t <= 0 || t >= 1) return null;
  return (
    <g opacity={1 - t}>
      {Array.from({length: 7}).map((_, i) => {
        const a = (i / 7) * Math.PI * 2;
        const r = (30 + t * 90) * size;
        return (
          <Rough
            key={i}
            shape={{kind: 'circle', cx: x + Math.cos(a) * r, cy: y + Math.sin(a) * r * 0.7, d: (40 + t * 30) * size}}
            salt={`${id}-${i}`}
            base={palette.white}
            strokeWidth={2}
          />
        );
      })}
    </g>
  );
};

/** Tempo-/Bewegungslinien hinter einer Figur. */
export const SpeedLines: React.FC<{x: number; y: number; dir?: 1 | -1; length?: number; opacity?: number; id?: string}> = ({
  x,
  y,
  dir = 1,
  length = 90,
  opacity = 1,
  id = 'speed',
}) => (
  <g opacity={opacity}>
    {[-40, 0, 40].map((dy, i) => (
      <Rough key={i} shape={{kind: 'line', x1: x, y1: y + dy, x2: x - dir * (length - i * 20), y2: y + dy}} salt={`${id}-${i}`} strokeWidth={2.4} />
    ))}
  </g>
);

/** Zwei leuchtende Augen im Schatten unter einer Hutkrempe (Folge 2). open 0..1. */
export const ShadowEyes: React.FC<{x: number; y: number; open: number; lookX?: number; size?: number; id?: string}> = ({
  x,
  y,
  open,
  lookX = 0,
  size = 1,
  id = 'seyes',
}) => {
  const frame = useCurrentFrame();
  const blink = Math.floor(frame / 3) % 30 === 0 ? 0.1 : 1;
  const h = 22 * open * blink;
  return (
    <g transform={`translate(${x},${y}) scale(${size})`}>
      {/* Hutkrempe als Silhouette */}
      <Rough shape={{kind: 'ellipse', cx: 0, cy: -28, w: 220, h: 36}} salt={`${id}-brim`} fill={palette.ink} fillStyle="solid" strokeWidth={2.6} />
      <Rough shape={{kind: 'path', d: 'M-50,-40 C-50,-90 50,-90 50,-40 Z'}} salt={`${id}-crown`} fill={palette.ink} fillStyle="solid" strokeWidth={2.6} />
      {h > 1
        ? [-26, 26].map((ex, i) => (
            <g key={i}>
              <ellipse cx={ex} cy={6} rx={16} ry={h / 2 + 2} fill={palette.white} stroke={palette.ink} strokeWidth={2} />
              <ellipse cx={ex + lookX * 6} cy={8} rx={6} ry={Math.max(1, h / 3)} fill={palette.ink} />
            </g>
          ))
        : null}
    </g>
  );
};

/** Kritzel-Explosion (Zacken) — ohne Text. t 0..1. */
export const Boom: React.FC<{x: number; y: number; t: number; size?: number; id?: string}> = ({x, y, t, size = 1, id = 'boom'}) => {
  if (t <= 0 || t >= 1.2) return null;
  const pts: [number, number][] = [];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const r = (i % 2 === 0 ? 150 : 80) * size * Math.min(1, t * 2);
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return (
    <g transform={`translate(${x},${y})`} opacity={t > 0.8 ? (1.2 - t) / 0.4 : 1}>
      <Rough shape={{kind: 'polygon', points: pts}} salt={id} fill={palette.senf} wash={palette.rosenrot} washOpacity={0.4} hachureGap={5} strokeWidth={3} />
    </g>
  );
};

/** Kritzel-Regen. */
export const Rain: React.FC<{w: number; h: number; amount?: number; speed?: number; color?: string; id?: string}> = ({
  w,
  h,
  amount = 40,
  speed = 28,
  color = palette.nightBlue,
  id = 'rain',
}) => {
  const frame = useCurrentFrame();
  return (
    <g>
      {Array.from({length: amount}).map((_, i) => {
        const x = ((i * 137) % w) + ((frame * 3) % 40);
        const y = ((i * 263 + frame * speed) % (h + 80)) - 40;
        return <line key={i} x1={x} y1={y} x2={x - 6} y2={y + 30} stroke={color} strokeWidth={2.6} strokeLinecap="round" opacity={0.7} />;
      })}
    </g>
  );
};
