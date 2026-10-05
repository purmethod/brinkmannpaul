import React from 'react';
import {palette} from '../../theme';
import {Rough} from '../rough/Rough';

/** Lockige Kritzel-Wolke, driftet langsam. */
export const Cloud: React.FC<{x: number; y: number; scale?: number; drift?: number; draw?: number; id: string}> = ({
  x,
  y,
  scale = 1,
  drift = 0,
  draw = 1,
  id,
}) => {
  if (draw <= 0) return null;
  return (
    <g transform={`translate(${x + Math.sin(drift * 0.01) * 20},${y}) scale(${scale})`}>
      <Rough
        shape={{
          kind: 'path',
          d: 'M-90,20 C-110,20 -110,-10 -86,-12 C-90,-40 -50,-48 -36,-26 C-30,-60 20,-62 26,-30 C40,-50 80,-40 74,-12 C100,-14 104,20 80,20 Z',
        }}
        salt={id}
        base={palette.paper}
        fill={palette.rosa}
        hachureGap={7}
        hachureAngle={20}
        fillWeight={1.2}
        strokeWidth={2.2}
        draw={draw}
      />
      <Rough shape={{kind: 'path', d: 'M-40,-6 q10,-10 20,0 M14,-10 q10,-10 20,0'}} salt={`${id}-curl`} strokeWidth={1.6} draw={draw} />
    </g>
  );
};
