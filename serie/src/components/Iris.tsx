import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';

/**
 * Klassische Iris-Blende: schwarze Fläche mit kreisrundem Loch.
 * radius = 0 => komplett schwarz; groß => offen. Mittelpunkt frei wählbar
 * (z. B. auf ein Gesicht).
 */
export const Iris: React.FC<{cx: number; cy: number; radius: number; color?: string}> = ({
  cx,
  cy,
  radius,
  color = '#0b0805',
}) => {
  const {width, height} = useVideoConfig();
  const maxR = Math.hypot(width, height);
  if (radius >= maxR) return null;
  const r = Math.max(0, radius);
  return (
    <AbsoluteFill>
      <svg width={width} height={height}>
        <defs>
          <radialGradient id="iris-soft" cx={cx} cy={cy} r={r + 6} gradientUnits="userSpaceOnUse">
            <stop offset={r > 0 ? (r - 3) / (r + 6) : 0} stopColor={color} stopOpacity={0} />
            <stop offset={1} stopColor={color} stopOpacity={1} />
          </radialGradient>
        </defs>
        <path
          fillRule="evenodd"
          fill={color}
          d={`M0,0 H${width} V${height} H0 Z M${cx - r - 5},${cy} a${r + 5},${r + 5} 0 1,0 ${2 * r + 10},0 a${r + 5},${r + 5} 0 1,0 ${-2 * r - 10},0 Z`}
        />
        {r > 0 ? <circle cx={cx} cy={cy} r={r + 6} fill="url(#iris-soft)" /> : null}
      </svg>
    </AbsoluteFill>
  );
};

/** Hilfsfunktion: Radius für Öffnen/Schließen (0..1) über die Bilddiagonale. */
export const irisRadius = (t: number, width: number, height: number) => t * Math.hypot(width, height) * 0.62;
