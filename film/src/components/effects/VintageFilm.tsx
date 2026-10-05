import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {noise1, rand} from '../../lib/random';

export type VintageFilmProps = {
  /** Kompletter Effekt an/aus. */
  enabled?: boolean;
  sepia?: number;
  grain?: number;
  flicker?: number;
  scratches?: boolean;
  dust?: boolean;
  vignette?: number;
  /** Bildwackeln in px. */
  gateWeave?: number;
  children: React.ReactNode;
};

/**
 * Vintage-Filmprojektion als Overlay: Sepia, Filmkorn, Helligkeitsflackern,
 * Kratzer, Staub, Vignette und minimales Bildwackeln (Gate Weave).
 * Alles deterministisch aus der Frame-Nummer.
 */
export const VintageFilm: React.FC<VintageFilmProps> = ({
  enabled = true,
  sepia = 0.42,
  grain = 0.42,
  flicker = 0.045,
  scratches = true,
  dust = true,
  vignette = 0.62,
  gateWeave = 2.2,
  children,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  if (!enabled) return <AbsoluteFill>{children}</AbsoluteFill>;

  const bright = 1 + (rand('flicker', frame) - 0.5) * flicker * 2 + noise1(frame * 0.2, 7) * flicker * 0.5;
  const wx = noise1(frame * 0.18, 1) * gateWeave;
  const wy = noise1(frame * 0.22, 2) * gateWeave * 1.4 + (rand('jump', frame) > 0.985 ? gateWeave * 2 : 0);
  const wr = noise1(frame * 0.12, 3) * 0.08;

  // Kratzer: wenige, lange vertikale Linien, die ein paar Frames bleiben
  const scratchEls: React.ReactNode[] = [];
  if (scratches) {
    const block = Math.floor(frame / 3);
    for (let i = 0; i < 2; i++) {
      if (rand('scr-on', block, i) < 0.55) continue;
      const x = rand('scr-x', block, i) * width + noise1(frame * 0.5, i) * 6;
      const top = rand('scr-t', block, i) * height * 0.5;
      const len = height * (0.35 + rand('scr-l', block, i) * 0.65);
      const light = rand('scr-c', block, i) > 0.4;
      scratchEls.push(
        <path
          key={`s${i}`}
          d={`M${x},${top} q${(rand('scr-q', block, i) - 0.5) * 10},${len / 2} ${(rand('scr-q2', block, i) - 0.5) * 6},${len}`}
          stroke={light ? '#fffaf0' : '#1a120c'}
          strokeWidth={0.8 + rand('scr-w', block, i) * 1.4}
          opacity={light ? 0.5 : 0.35}
          fill="none"
        />,
      );
    }
  }

  // Staub + Fusseln: einzelne Frames
  const dustEls: React.ReactNode[] = [];
  if (dust) {
    const n = Math.floor(rand('dust-n', frame) * 4);
    for (let i = 0; i < n; i++) {
      const x = rand('dx', frame, i) * width;
      const y = rand('dy', frame, i) * height;
      const r = 1 + rand('dr', frame, i) * 3.5;
      if (rand('dt', frame, i) > 0.7) {
        const a = rand('da', frame, i) * 40;
        dustEls.push(
          <path
            key={`h${i}`}
            d={`M${x},${y} c${a},${-a / 2} ${a / 2},${a} ${a * 1.4},${a * 0.8}`}
            stroke="#1a120c"
            strokeWidth={1.2}
            opacity={0.55}
            fill="none"
          />,
        );
      } else {
        dustEls.push(<circle key={`d${i}`} cx={x} cy={y} r={r} fill="#1a120c" opacity={0.6} />);
      }
    }
  }

  return (
    <AbsoluteFill
      style={{
        filter: `sepia(${sepia}) saturate(0.9) brightness(${bright * 0.97})`,
        overflow: 'hidden',
        backgroundColor: '#000',
      }}
    >
      <AbsoluteFill style={{transform: `translate(${wx}px,${wy}px) rotate(${wr}deg) scale(1.012)`}}>
        {children}
      </AbsoluteFill>
      {/* Filmkorn */}
      <svg width={width} height={height} style={{position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: grain}}>
        <filter id="vf-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={frame % 997} stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1" />
        </filter>
        <rect width={width} height={height} filter="url(#vf-grain)" />
      </svg>
      <svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
        {scratchEls}
        {dustEls}
      </svg>
      {/* Vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 58%, rgba(20,10,4,${vignette * 0.4}) 82%, rgba(10,5,2,${vignette}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
