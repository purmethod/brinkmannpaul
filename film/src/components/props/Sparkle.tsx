import React from 'react';
import {palette} from '../../theme';
import {Rough} from '../rough/Rough';

/** Kritzel-Sternchen (Traum / Funkeln). */
export const Sparkle: React.FC<{
  x: number;
  y: number;
  size?: number;
  rotation?: number;
  color?: string;
  salt: string;
  draw?: number;
}> = ({x, y, size = 24, rotation = 0, color = palette.senf, salt, draw = 1}) => {
  const r = size / 2;
  const ri = r * 0.38;
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : ri;
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  return (
    <g transform={`translate(${x},${y}) rotate(${rotation})`}>
      <Rough
        shape={{kind: 'polygon', points: pts}}
        salt={salt}
        fill={color}
        wash={color}
        washOpacity={0.6}
        hachureGap={2.6}
        strokeWidth={1.8}
        roughness={1.1}
        draw={draw}
      />
    </g>
  );
};

/** Kritzel-Fragezeichen. */
export const QuestionMark: React.FC<{
  x: number;
  y: number;
  size?: number;
  rotation?: number;
  color?: string;
  salt: string;
}> = ({x, y, size = 34, rotation = 0, color = palette.ink, salt}) => {
  const s = size / 34;
  return (
    <g transform={`translate(${x},${y}) rotate(${rotation}) scale(${s})`}>
      <Rough
        shape={{kind: 'path', d: 'M-10,-10 C-10,-24 12,-26 12,-12 C12,-2 0,0 0,10'}}
        salt={salt}
        stroke={color}
        strokeWidth={3.4}
        roughness={1}
      />
      <Rough shape={{kind: 'circle', cx: 0, cy: 20, d: 5}} salt={`${salt}-dot`} stroke={color} strokeWidth={3} fill={color} fillStyle="solid" />
    </g>
  );
};
