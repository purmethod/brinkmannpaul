import React from 'react';
import {palette} from '../theme';
import {Rough} from './Rough';

/** Stadtplan aus Pergament (in Karimas Händen: Ursprung = vordere Hand). Nur Kritzel-Symbole. */
export const TownMap: React.FC<{rotation?: number; id?: string; offsetX?: number}> = ({rotation = 0, id = 'map', offsetX = -40}) => (
  <g transform={`translate(${offsetX},4) rotate(${rotation})`}>
    <Rough
      shape={{kind: 'path', d: 'M-78,-52 L-26,-58 L24,-50 L78,-56 L74,52 L24,58 L-26,50 L-76,56 Z'}}
      salt={`${id}-sheet`}
      base={palette.paper}
      fill={palette.senf}
      hachureGap={9}
      fillWeight={1}
      strokeWidth={2.4}
    />
    <Rough shape={{kind: 'path', d: 'M-26,-58 L-26,50 M24,-50 L24,58'}} salt={`${id}-folds`} stroke={palette.inkSoft} strokeWidth={1.2} />
    <Rough shape={{kind: 'path', d: 'M-64,30 C-40,10 -30,40 -6,14 S30,-30 52,-20'}} salt={`${id}-path`} stroke={palette.rosenrot} strokeWidth={2.4} />
    <Rough shape={{kind: 'path', d: 'M44,-30 l14,14 m0,-14 l-14,14'}} salt={`${id}-x`} stroke={palette.rosenrot} strokeWidth={3} />
    {[
      [-52, -30],
      [-8, -34],
      [36, 26],
    ].map(([x, y], i) => (
      <Rough key={i} shape={{kind: 'path', d: `M${x - 8},${y + 8} L${x - 8},${y} L${x},${y - 8} L${x + 8},${y} L${x + 8},${y + 8} Z`}} salt={`${id}-h${i}`} strokeWidth={1.6} />
    ))}
    {/* Kompassrose */}
    <Rough shape={{kind: 'path', d: 'M-56,40 l0,-14 m-7,7 l14,0'}} salt={`${id}-compass`} strokeWidth={1.6} />
  </g>
);
