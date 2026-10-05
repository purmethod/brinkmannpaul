import React from 'react';
import {useCurrentFrame} from 'remotion';
import {palette} from '../theme';
import {Sparkle} from './Sparkle';

const COLORS = [palette.senf, palette.rosa, palette.salbei, palette.senf, palette.rosenrot, palette.rosa];

/** Träume als Kritzel-Sternchen, die um einen Punkt kreisen und funkeln. */
export const DreamStars: React.FC<{
  cx: number;
  cy: number;
  radius?: number;
  count?: number;
  /** 0..1 Einblenden (Sterne erscheinen nacheinander). */
  appear?: number;
  /** Größenfaktor der Sternchen. */
  size?: number;
  id?: string;
}> = ({cx, cy, radius = 120, count = 6, appear = 1, size = 1, id = 'dreams'}) => {
  const frame = useCurrentFrame();
  return (
    <g>
      {Array.from({length: count}).map((_, i) => {
        const local = Math.min(1, Math.max(0, appear * count - i));
        if (local <= 0) return null;
        const a = (i / count) * Math.PI * 2 + frame * 0.025;
        const rx = radius * (1 + 0.12 * Math.sin(frame * 0.07 + i));
        const x = cx + Math.cos(a) * rx;
        // Bogen (Heiligenschein) über dem Kopf, damit kein Sternchen übers Gesicht wandert
        const y = cy - radius * 0.35 - (1 - Math.abs(Math.cos(a))) * radius * 0.45 + Math.sin(a) * 10;
        const twinkle = 0.75 + 0.35 * Math.sin(frame * 0.3 + i * 1.7);
        return (
          <Sparkle
            key={i}
            x={x}
            y={y}
            size={(16 + (i % 3) * 7) * size * twinkle * local}
            rotation={frame * 2 + i * 40}
            color={COLORS[i % COLORS.length]}
            salt={`${id}-${i}`}
          />
        );
      })}
    </g>
  );
};
