import React from 'react';
import {palette} from '../theme';
import {Rough} from './Rough';

type Pt = [number, number];

const pointAt = (pts: Pt[], t: number): Pt => {
  const seg = (pts.length - 1) * t;
  const i = Math.min(pts.length - 2, Math.floor(seg));
  const f = seg - i;
  return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
};

/** Kleine Kritzel-Rose (Spirale + Blätter), Referenz Cover-Motiv. */
export const Rose: React.FC<{x: number; y: number; size?: number; bloom?: number; salt: string}> = ({
  x,
  y,
  size = 1,
  bloom = 1,
  salt,
}) => {
  if (bloom <= 0) return null;
  return (
    <g transform={`translate(${x},${y}) scale(${size * (0.4 + 0.6 * bloom)})`}>
      <Rough
        shape={{kind: 'circle', cx: 0, cy: 0, d: 30}}
        salt={`${salt}-bloom`}
        fill={palette.rosenrot}
        wash={palette.rosenrot}
        washOpacity={0.5}
        hachureGap={3}
        strokeWidth={2}
        draw={bloom}
      />
      <Rough
        shape={{kind: 'path', d: 'M0,0 C4,-3 5,4 0,5 C-6,6 -8,-3 -2,-7 C6,-11 11,-2 9,5 C6,12 -6,13 -11,6'}}
        salt={`${salt}-spiral`}
        strokeWidth={1.8}
        draw={bloom}
      />
    </g>
  );
};

/** Blatt in Salbeigrün. */
export const Leaf: React.FC<{x: number; y: number; angle: number; size?: number; grow?: number; salt: string}> = ({
  x,
  y,
  angle,
  size = 1,
  grow = 1,
  salt,
}) => {
  if (grow <= 0) return null;
  return (
    <g transform={`translate(${x},${y}) rotate(${angle}) scale(${size * grow})`}>
      <Rough
        shape={{kind: 'path', d: 'M0,0 C8,-10 22,-10 28,0 C22,10 8,10 0,0 Z'}}
        salt={salt}
        fill={palette.salbei}
        wash={palette.salbei}
        washOpacity={0.5}
        hachureGap={3}
        strokeWidth={1.8}
      />
    </g>
  );
};

/**
 * Wachsende Ranke entlang eines Pfads (Punktliste): Stängel zeichnet sich,
 * Blätter sprießen, am Ende blüht eine Rose.
 */
export const Vine: React.FC<{points: Pt[]; grow: number; id: string; leaves?: number; rose?: boolean}> = ({
  points,
  grow,
  id,
  leaves = 6,
  rose = true,
}) => {
  if (grow <= 0) return null;
  return (
    <g>
      <Rough shape={{kind: 'curve', points}} salt={`${id}-stem`} stroke={palette.inkSoft} strokeWidth={2.2} draw={grow} />
      {Array.from({length: leaves}).map((_, i) => {
        const t = (i + 0.7) / (leaves + 0.5);
        const g = Math.min(1, Math.max(0, (grow - t) * 6));
        const [lx, ly] = pointAt(points, t);
        const side = i % 2 === 0 ? 1 : -1;
        return <Leaf key={i} x={lx} y={ly} angle={side * 55 + i * 17 - 90} size={1.15} grow={g} salt={`${id}-leaf${i}`} />;
      })}
      {rose ? (
        <Rose
          x={points[points.length - 1][0]}
          y={points[points.length - 1][1]}
          bloom={Math.min(1, Math.max(0, (grow - 0.85) * 6.6))}
          salt={`${id}-rose`}
        />
      ) : null}
    </g>
  );
};
