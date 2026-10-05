import React from 'react';
import {palette} from '../../theme';
import {Rough} from '../rough/Rough';

/** Kleiner Reisekoffer; Ursprung = Griff (dort greift die Hand). */
export const Suitcase: React.FC<{id?: string; swing?: number; scale?: number}> = ({
  id = 'case',
  swing = 0,
  scale = 1,
}) => (
  <g transform={`rotate(${swing}) scale(${scale})`}>
    <Rough shape={{kind: 'path', d: 'M-12,8 Q-12,-6 0,-6 Q12,-6 12,8'}} salt={`${id}-handle`} strokeWidth={3} />
    <Rough
      shape={{kind: 'rect', x: -34, y: 8, w: 68, h: 50}}
      salt={`${id}-body`}
      fill={palette.senf}
      wash={palette.senf}
      washOpacity={0.45}
      hachureGap={5}
      strokeWidth={2.8}
    />
    <Rough shape={{kind: 'line', x1: -18, y1: 8, x2: -18, y2: 58}} salt={`${id}-s1`} stroke={palette.rosenrot} strokeWidth={4} />
    <Rough shape={{kind: 'line', x1: 18, y1: 8, x2: 18, y2: 58}} salt={`${id}-s2`} stroke={palette.rosenrot} strokeWidth={4} />
    <Rough shape={{kind: 'rect', x: -6, y: 14, w: 12, h: 8}} salt={`${id}-lock`} strokeWidth={1.8} />
    {/* Reise-Aufkleber */}
    <Rough
      shape={{kind: 'circle', cx: 2, cy: 40, d: 14}}
      salt={`${id}-sticker`}
      fill={palette.salbei}
      fillStyle="cross-hatch"
      hachureGap={2.6}
      strokeWidth={1.6}
    />
  </g>
);
