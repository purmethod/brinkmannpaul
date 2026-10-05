import React from 'react';
import {useCurrentFrame} from 'remotion';
import {palette} from '../theme';
import {Rough} from './Rough';

/**
 * Brieftaube (wiederkehrend): weiß, Flügel schlagen, optional mit Brief im Schnabel.
 * Ursprung = Körpermitte. `flying=false` => sitzt mit angelegten Flügeln.
 */
export const Dove: React.FC<{
  x: number;
  y: number;
  size?: number;
  facing?: 1 | -1;
  rotation?: number;
  flying?: boolean;
  letter?: boolean;
  id?: string;
}> = ({x, y, size = 1, facing = 1, rotation = 0, flying = true, letter = false, id = 'dove'}) => {
  const frame = useCurrentFrame();
  const flap = flying ? Math.sin(frame * 0.7) : -0.6;
  const wing = (back: boolean) => (
    <g transform={`rotate(${(back ? -8 : 0) + flap * 42},-4,-6)`} opacity={back ? 0.9 : 1}>
      <Rough
        shape={{kind: 'path', d: 'M-4,-6 C-20,-50 10,-74 30,-66 C22,-52 30,-40 22,-26 C14,-16 6,-10 -4,-6 Z'}}
        salt={`${id}-wing${back ? 'b' : 'f'}`}
        fill={palette.white}
        fillStyle="solid"
        strokeWidth={2.2}
      />
      <Rough shape={{kind: 'path', d: 'M4,-30 L22,-50 M8,-20 L26,-36'}} salt={`${id}-feathers${back ? 'b' : 'f'}`} strokeWidth={1.4} stroke={palette.inkSoft} />
    </g>
  );
  return (
    <g transform={`translate(${x},${y}) rotate(${rotation}) scale(${size * facing},${size})`}>
      {wing(true)}
      {/* Schwanz */}
      <Rough shape={{kind: 'path', d: 'M-30,0 L-62,-10 L-60,8 L-30,10 Z'}} salt={`${id}-tail`} fill={palette.white} fillStyle="solid" strokeWidth={2.2} />
      {/* Körper */}
      <Rough shape={{kind: 'path', d: 'M-34,4 C-30,-18 0,-20 22,-14 C34,-10 42,0 34,12 C20,22 -20,22 -34,4 Z'}} salt={`${id}-body`} fill={palette.white} fillStyle="solid" strokeWidth={2.4} />
      {/* Kopf */}
      <Rough shape={{kind: 'circle', cx: 34, cy: -16, d: 26}} salt={`${id}-head`} fill={palette.white} fillStyle="solid" strokeWidth={2.4} />
      <circle cx={38} cy={-19} r={3.4} fill={palette.ink} />
      <circle cx={37} cy={-20} r={1.1} fill={palette.white} />
      <Rough shape={{kind: 'path', d: 'M46,-16 L58,-12 L46,-9 Z'}} salt={`${id}-beak`} fill={palette.senf} fillStyle="solid" strokeWidth={1.8} />
      {/* Halsring in Rosenrot (Wiedererkennung) */}
      <Rough shape={{kind: 'path', d: 'M24,-8 Q32,-2 42,-6'}} salt={`${id}-ring`} stroke={palette.rosenrot} strokeWidth={3} />
      {!flying ? <Rough shape={{kind: 'path', d: 'M-4,18 L-8,30 M6,18 L4,30'}} salt={`${id}-legs`} stroke={palette.rosenrot} strokeWidth={2.4} /> : null}
      {letter ? (
        <g transform="translate(56,-6) rotate(14)">
          <Rough shape={{kind: 'rect', x: 0, y: -10, w: 30, h: 20}} salt={`${id}-letter`} fill={palette.paper} fillStyle="solid" strokeWidth={1.8} />
          <Rough shape={{kind: 'path', d: 'M0,-10 L15,2 L30,-10'}} salt={`${id}-letter-v`} strokeWidth={1.4} />
          <circle cx={15} cy={3} r={3.2} fill={palette.rosenrot} />
        </g>
      ) : null}
      {wing(false)}
    </g>
  );
};
