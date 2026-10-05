import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {SCRIPT_FONT} from '../lib/fonts';
import {palette} from '../theme';
import {Rough} from './Rough';
import {Rose} from './Vines';

/** Kleines verschnörkeltes Badge oben links: "Part X". Springt in den ersten Frames herein (Hook). */
export const EpisodeBadge: React.FC<{nr: number}> = ({nr}) => {
  const frame = useCurrentFrame();
  const pop = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2.2))});
  const x = 56;
  const y = 70;
  const w = 250;
  const h = 104;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <g transform={`translate(${x + w / 2},${y + h / 2}) scale(${pop}) rotate(${-4 + Math.sin(frame * 0.08) * 1.2}) translate(${-w / 2},${-h / 2})`}>
        <Rough
          shape={{kind: 'path', d: `M14,0 H${w - 14} Q${w},0 ${w},14 V${h - 14} Q${w},${h} ${w - 14},${h} H14 Q0,${h} 0,${h - 14} V14 Q0,0 14,0 Z`}}
          salt="badge-frame"
          base={palette.paper}
          fill={palette.rosa}
          hachureGap={7}
          fillWeight={1.1}
          strokeWidth={2.6}
        />
        <Rough
          shape={{kind: 'path', d: `M22,10 H${w - 22} Q${w - 10},10 ${w - 10},22 V${h - 22} Q${w - 10},${h - 10} ${w - 22},${h - 10} H22 Q10,${h - 10} 10,${h - 22} V22 Q10,10 22,10 Z`}}
          salt="badge-inner"
          stroke={palette.rosenrot}
          strokeWidth={1.6}
        />
        <text x={w / 2 + 10} y={h * 0.7} textAnchor="middle" fontFamily={SCRIPT_FONT} fontSize={64} fill={palette.ink} stroke={palette.ink} strokeWidth={0.6}>
          {`Part ${nr}`}
        </text>
        <Rose x={20} y={h - 16} size={0.75} salt="badge-rose" />
        <Rough shape={{kind: 'path', d: `M${w - 40},-8 C${w - 20},-22 ${w + 6},-10 ${w - 6},6`}} salt="badge-curl" stroke={palette.salbei} strokeWidth={2.4} />
      </g>
    </svg>
  );
};
