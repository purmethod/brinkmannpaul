import React from 'react';
import {useCurrentFrame} from 'remotion';
import {palette} from '../theme';
import {Rough} from './Rough';

/** Krummer Holzzaun; Ursprung = linker Fußpunkt. */
export const Fence: React.FC<{x: number; y: number; posts?: number; gap?: number; h?: number; id?: string}> = ({
  x,
  y,
  posts = 4,
  gap = 90,
  h = 150,
  id = 'fence',
}) => (
  <g transform={`translate(${x},${y})`}>
    {Array.from({length: posts}).map((_, i) => (
      <Rough
        key={i}
        shape={{kind: 'path', d: `M${i * gap - 10},0 L${i * gap - 9},${-h} L${i * gap},${-h - 16} L${i * gap + 10},${-h} L${i * gap + 10},0`}}
        salt={`${id}-p${i}`}
        base={palette.paper}
        fill={palette.wood}
        hachureGap={5}
        strokeWidth={2.4}
      />
    ))}
    <Rough shape={{kind: 'line', x1: -20, y1: -h * 0.7, x2: (posts - 1) * gap + 20, y2: -h * 0.66}} salt={`${id}-r1`} stroke={palette.woodDark} strokeWidth={6} />
    <Rough shape={{kind: 'line', x1: -20, y1: -h * 0.3, x2: (posts - 1) * gap + 20, y2: -h * 0.34}} salt={`${id}-r2`} stroke={palette.woodDark} strokeWidth={6} />
  </g>
);

/**
 * Lebendiges Seil: kriecht vom Zaunpfosten (from) zum Ziel (to), wickelt sich herum
 * (wrap 0..1) und fällt ab (drop 0..1).
 */
export const Rope: React.FC<{
  from: {x: number; y: number};
  to: {x: number; y: number};
  reach: number;
  wrap: number;
  drop: number;
  /** Breite der Schlingen um das Ziel. */
  girth?: number;
  id?: string;
}> = ({from, to, reach, wrap, drop, girth = 90, id = 'rope'}) => {
  const frame = useCurrentFrame();
  if (reach <= 0) return null;
  // Schlangenlinie zum Ziel
  const pts: [number, number][] = [];
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * reach;
    const px = from.x + (to.x - from.x) * u;
    const py = from.y + (to.y - from.y) * u + Math.sin(u * 12 - frame * 0.5) * 22 * (1 - wrap);
    pts.push([px, py]);
  }
  const fall = drop * 260;
  return (
    <g opacity={1 - drop * 0.9}>
      <Rough shape={{kind: 'curve', points: pts}} salt={`${id}-line`} stroke={palette.senf} strokeWidth={6} multiStroke={false} />
      <Rough shape={{kind: 'curve', points: pts}} salt={`${id}-ink`} strokeWidth={1.6} />
      {wrap > 0
        ? [0, 1].map((i) => (
            <g key={i} transform={`translate(${to.x},${to.y + i * 70 - 30 + fall * (1 + i * 0.3)}) scale(${1 + drop * 0.6},1)`}>
              <Rough
                shape={{kind: 'ellipse', cx: 0, cy: 0, w: girth * 2, h: 34}}
                salt={`${id}-loop${i}`}
                stroke={palette.senf}
                strokeWidth={6}
                draw={Math.min(1, wrap * 2 - i * 0.5)}
                multiStroke={false}
              />
            </g>
          ))
        : null}
    </g>
  );
};
