import React from 'react';
import {useCurrentFrame} from 'remotion';
import {palette} from '../../theme';
import {Rough} from '../rough/Rough';

/** Kritzel-Schmetterling mit schlagenden Flügeln (Flügel = scaleX-Flattern). */
export const Butterfly: React.FC<{
  x: number;
  y: number;
  size?: number;
  rotation?: number;
  color?: string;
  accent?: string;
  id?: string;
}> = ({x, y, size = 1, rotation = 0, color = palette.senf, accent = palette.rosenrot, id = 'bfly'}) => {
  const frame = useCurrentFrame();
  const flap = 0.25 + 0.75 * Math.abs(Math.cos(frame * 0.55));
  const wing = (side: 1 | -1) => (
    <g transform={`scale(${side * flap},1)`}>
      <Rough
        shape={{kind: 'path', d: 'M2,-2 C10,-34 44,-36 40,-12 C38,2 18,4 2,0 Z'}}
        salt={`${id}-up${side}`}
        fill={color}
        wash={color}
        washOpacity={0.55}
        hachureGap={3}
        strokeWidth={2}
      />
      <Rough
        shape={{kind: 'path', d: 'M2,2 C18,4 34,12 28,28 C22,40 6,26 2,6 Z'}}
        salt={`${id}-lo${side}`}
        fill={accent}
        wash={accent}
        washOpacity={0.45}
        hachureGap={3}
        strokeWidth={2}
      />
      <Rough shape={{kind: 'circle', cx: 24, cy: -16, d: 8}} salt={`${id}-spot${side}`} fill={palette.ink} fillStyle="solid" strokeWidth={1} />
    </g>
  );
  return (
    <g transform={`translate(${x},${y}) rotate(${rotation}) scale(${size})`}>
      {wing(-1)}
      {wing(1)}
      <Rough shape={{kind: 'ellipse', cx: 0, cy: 4, w: 6, h: 30}} salt={`${id}-body`} fill={palette.ink} fillStyle="solid" strokeWidth={1.6} />
      <Rough shape={{kind: 'path', d: 'M-1,-10 Q-6,-22 -12,-24 M1,-10 Q6,-22 12,-24'}} salt={`${id}-ant`} strokeWidth={1.4} />
    </g>
  );
};
