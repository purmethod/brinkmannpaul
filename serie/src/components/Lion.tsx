import React from 'react';
import {useCurrentFrame} from 'remotion';
import {palette} from '../theme';
import {HoseLimb} from './HoseLimb';
import {Rough} from './Rough';

/** Kritzel-Löwe mit Wuschelmähne; trottet (walkCycle), kann zwinkern. Ursprung = Boden Mitte. */
export const Lion: React.FC<{
  walkCycle?: number;
  walking?: boolean;
  wink?: number;
  facing?: 1 | -1;
  id?: string;
}> = ({walkCycle = 0, walking = false, wink = 0, facing = 1, id = 'lion'}) => {
  const frame = useCurrentFrame();
  const ph = walkCycle * Math.PI * 2;
  const bob = walking ? -Math.abs(Math.sin(ph)) * 8 : 0;
  const legs = [
    {x: -60, phase: 0},
    {x: -36, phase: Math.PI},
    {x: 44, phase: Math.PI},
    {x: 66, phase: 0},
  ];
  // Wuschelmähne: Zickzack-Kreis
  const mane: [number, number][] = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const r = i % 2 === 0 ? 66 : 50;
    mane.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  const tail = Math.sin(frame * 0.2) * 14;
  return (
    <g transform={`scale(${facing},1)`}>
      <ellipse cx={0} cy={2} rx={100} ry={10} fill={palette.ink} opacity={0.13} />
      <g transform={`translate(0,${bob})`}>
        <Rough shape={{kind: 'path', d: `M-86,-90 C-120,-110 -130,${-150 + tail} -112,${-160 + tail}`}} salt={`${id}-tail`} strokeWidth={4} />
        <Rough shape={{kind: 'circle', cx: -112, cy: -164 + tail, d: 18}} salt={`${id}-tuft`} fill={palette.woodDark} fillStyle="cross-hatch" hachureGap={2.6} strokeWidth={2} />
        {legs.map((l, i) => {
          const sw = walking ? Math.sin(ph + l.phase) * 18 : 0;
          return <HoseLimb key={i} from={{x: l.x, y: -70}} to={{x: l.x + sw, y: -6 - bob}} bend={-4} thickness={18} color={palette.senf} salt={`${id}-leg${i}`} />;
        })}
        <Rough
          shape={{kind: 'ellipse', cx: 0, cy: -96, w: 190, h: 90}}
          salt={`${id}-body`}
          fill={palette.senf}
          wash={palette.senf}
          washOpacity={0.6}
          hachureGap={5}
          strokeWidth={2.8}
        />
        <g transform="translate(92,-140)">
          <Rough shape={{kind: 'polygon', points: mane}} salt={`${id}-mane`} fill={palette.wood} wash={palette.wood} washOpacity={0.55} hachureGap={3.6} fillStyle="zigzag" strokeWidth={2.4} />
          <Rough shape={{kind: 'circle', cx: 0, cy: 4, d: 74}} salt={`${id}-face`} fill={palette.senf} fillStyle="solid" strokeWidth={2.6} />
          {[-1, 1].map((s) => (
            <Rough key={s} shape={{kind: 'circle', cx: s * 28, cy: -30, d: 18}} salt={`${id}-ear${s}`} fill={palette.senf} fillStyle="solid" strokeWidth={2} />
          ))}
          {/* Augen: rechtes zwinkert */}
          <circle cx={-13} cy={-4} r={6} fill={palette.ink} />
          {wink > 0.5 ? (
            <Rough shape={{kind: 'path', d: 'M7,-4 Q13,2 19,-4'}} salt={`${id}-wink`} strokeWidth={3} />
          ) : (
            <circle cx={13} cy={-4} r={6} fill={palette.ink} />
          )}
          <Rough shape={{kind: 'path', d: 'M-8,10 L8,10 L0,18 Z'}} salt={`${id}-nose`} fill={palette.ink} fillStyle="solid" strokeWidth={1.6} />
          <Rough shape={{kind: 'path', d: 'M-12,24 Q-6,30 0,22 Q6,30 12,24'}} salt={`${id}-mouth`} strokeWidth={2.2} />
          <Rough shape={{kind: 'path', d: 'M-20,16 L-40,12 M-20,20 L-40,22 M20,16 L40,12 M20,20 L40,22'}} salt={`${id}-whisk`} strokeWidth={1.4} />
        </g>
      </g>
    </g>
  );
};
