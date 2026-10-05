import React, {useMemo} from 'react';
import {palette} from '../../theme';
import {SCRIPT_FONT} from '../../lib/fonts';
import {Rough} from '../rough/Rough';

export type TitleLine = {text: string; x: number; y: number; size: number};

/** Echte Textbreite (Schrift ist vor dem Rendern geladen, siehe ensureFonts). */
const measure = (text: string, size: number) => {
  if (typeof document === 'undefined') return text.length * size * 0.42;
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return text.length * size * 0.42;
  ctx.font = `${size}px ${SCRIPT_FONT}`;
  return ctx.measureText(text).width;
};

/**
 * Verschnörkelte Schrift, die sich wie mit der Feder von links nach rechts
 * schreibt; danach zieht sich ein Schnörkel darunter.
 */
export const OrnateTitle: React.FC<{
  lines: TitleLine[];
  /** 0..1 Schreibfortschritt über alle Zeilen. */
  write: number;
  /** 0..1 Zier-Schnörkel unter dem Text. */
  flourish?: number;
  color?: string;
  id?: string;
}> = ({lines: input, write, flourish = 0, color = palette.ink, id = 'title'}) => {
  const lines = useMemo(() => input.map((l) => ({...l, width: measure(l.text, l.size) + l.size * 0.15})), [input]);
  const total = lines.reduce((a, l) => a + l.width, 0);
  let acc = 0;
  let nib: {x: number; y: number} | null = null;
  const els = lines.map((l, i) => {
    const start = acc / total;
    const end = (acc + l.width) / total;
    acc += l.width;
    const p = Math.min(1, Math.max(0, (write - start) / (end - start)));
    if (p > 0 && p < 1) nib = {x: l.x + l.width * p, y: l.y - l.size * 0.25};
    const clipId = `${id}-clip-${i}`;
    return (
      <g key={i}>
        <defs>
          <clipPath id={clipId}>
            <rect x={l.x - l.size * 0.4} y={l.y - l.size * 1.3} width={(l.width + l.size * 0.4) * p + 2} height={l.size * 2} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <text
            x={l.x}
            y={l.y}
            fontFamily={SCRIPT_FONT}
            fontSize={l.size}
            fill={color}
            stroke={color}
            strokeWidth={0.8}
            style={{fontKerning: 'normal'}}
          >
            {l.text}
          </text>
        </g>
      </g>
    );
  });

  const last = lines[lines.length - 1];
  const fx = last.x - 10;
  const fy = last.y + last.size * 0.28;
  const fw = last.width + 20;
  const nibPos = nib as {x: number; y: number} | null;
  return (
    <g>
      {els}
      <Rough
        shape={{
          kind: 'path',
          d: `M${fx},${fy} C${fx + fw * 0.25},${fy + 18} ${fx + fw * 0.45},${fy - 14} ${fx + fw * 0.6},${fy} S${fx + fw * 0.9},${fy + 12} ${fx + fw},${fy - 6} c8,-8 -4,-16 -10,-8`,
        }}
        salt={`${id}-flourish`}
        stroke={palette.rosenrot}
        strokeWidth={2.4}
        draw={flourish}
      />
      {nibPos ? (
        <g transform={`translate(${nibPos.x},${nibPos.y}) rotate(-35)`}>
          <path d="M0,0 L-6,-30 L0,-46 L6,-30 Z" fill={palette.inkSoft} stroke={palette.ink} strokeWidth={1.5} />
          <line x1={0} y1={-6} x2={0} y2={-28} stroke="#FBF6EA" strokeWidth={1} />
          <rect x={-4} y={-110} width={8} height={66} fill={palette.wood} stroke={palette.ink} strokeWidth={1.5} />
        </g>
      ) : null}
    </g>
  );
};
