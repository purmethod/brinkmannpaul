import React from 'react';
import {useCurrentFrame} from 'remotion';
import {palette} from '../theme';
import {Rough} from './Rough';

/** Krumme Straßenlaterne; Ursprung = Fußpunkt. */
export const Lantern: React.FC<{
  x: number;
  y: number;
  h?: number;
  bend?: number;
  draw?: number;
  lean?: number;
  id: string;
}> = ({x, y, h = 260, bend = 20, draw = 1, lean = 0, id}) => {
  const frame = useCurrentFrame();
  if (draw <= 0) return null;
  const glow = 0.55 + 0.15 * Math.sin(frame * 0.4 + id.length);
  const topX = bend;
  const lampDraw = Math.max(0, draw * 1.5 - 0.5);
  return (
    <g transform={`translate(${x},${y}) rotate(${lean})`}>
      <Rough
        shape={{kind: 'path', d: `M0,0 C4,${-h * 0.4} ${-bend * 0.5},${-h * 0.7} ${topX},${-h}`}}
        salt={`${id}-post`}
        strokeWidth={4.5}
        draw={Math.min(1, draw * 1.5)}
      />
      <Rough shape={{kind: 'line', x1: -14, y1: 0, x2: 14, y2: 0}} salt={`${id}-foot`} strokeWidth={3} draw={draw} />
      {lampDraw > 0 ? (
        <g transform={`translate(${topX},${-h})`}>
          <circle cx={0} cy={22} r={44} fill={palette.senf} opacity={0.22 * glow * lampDraw} />
          <Rough
            shape={{kind: 'polygon', points: [[-14, 4], [14, 4], [10, 40], [-10, 40]]}}
            salt={`${id}-glass`}
            fill={palette.senf}
            wash={palette.senf}
            washOpacity={0.6 * glow}
            hachureGap={3}
            strokeWidth={2.4}
            draw={lampDraw}
          />
          <Rough shape={{kind: 'polygon', points: [[-20, 6], [20, 6], [0, -14]]}} salt={`${id}-cap`} fill={palette.ink} hachureGap={3} strokeWidth={2.2} draw={lampDraw} />
        </g>
      ) : null}
    </g>
  );
};
