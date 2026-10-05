import React from 'react';
import {palette} from '../../theme';
import {Rough} from '../rough/Rough';

/** Krumme Gasse mit Pflastersteinen, die in die Tiefe führt. */
export const Lane: React.FC<{draw?: number; id?: string}> = ({draw = 1, id = 'lane'}) => {
  if (draw <= 0) return null;
  const stones: React.ReactNode[] = [];
  let n = 0;
  for (let row = 0; row < 6; row++) {
    const t = row / 6;
    const y = 900 + (1 - t) * 0 - row * 26;
    const half = 300 * (1 - t * 0.78);
    const cx = 540 + Math.sin(t * 3) * 40 * t;
    const count = 7 - Math.floor(row / 2);
    for (let i = 0; i < count; i++) {
      const sx = cx - half + ((i + 0.5 + (row % 2) * 0.4) / count) * half * 2;
      const local = Math.min(1, Math.max(0, draw * 2 - (n / 40)));
      n++;
      if (local <= 0) continue;
      stones.push(
        <Rough
          key={`${row}-${i}`}
          shape={{kind: 'ellipse', cx: sx, cy: y, w: (half / count) * 1.4, h: 16 * (1 - t * 0.5)}}
          salt={`${id}-st${row}-${i}`}
          strokeWidth={1.6}
          stroke={palette.inkSoft}
          draw={local}
        />,
      );
    }
  }
  return (
    <g>
      {/* Gassenränder: krumm in die Tiefe */}
      <Rough
        shape={{kind: 'curve', points: [[160, 1000], [300, 870], [420, 780], [470, 700], [500, 640]]}}
        salt={`${id}-edgeL`}
        strokeWidth={2.6}
        draw={draw}
      />
      <Rough
        shape={{kind: 'curve', points: [[920, 1000], [790, 880], [660, 790], [620, 700], [590, 640]]}}
        salt={`${id}-edgeR`}
        strokeWidth={2.6}
        draw={draw}
      />
      {stones}
    </g>
  );
};
