import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {palette} from '../../theme';

/** Vergilbtes Papier: Grundton, Flecken und Fasern (statisch — Papier bewegt sich nicht). */
export const PaperTexture: React.FC<{color?: string; stains?: number; id?: string}> = ({
  color = palette.paper,
  stains = 0.3,
  id = 'paper',
}) => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: color}}>
      <svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
        <filter id={`${id}-stain`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves={3} seed={11} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.38  0 0 0 0 0.16  0 0 0 1.6 -0.75" />
        </filter>
        <filter id={`${id}-fiber`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9 0.05" numOctaves={2} seed={4} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0 0.12  0 0 0 1.2 -0.5" />
        </filter>
        <rect width={width} height={height} filter={`url(#${id}-stain)`} opacity={stains} />
        <rect width={width} height={height} filter={`url(#${id}-fiber)`} opacity={0.25} />
        <radialGradient id={`${id}-edge`} cx="50%" cy="50%" r="72%">
          <stop offset="0.6" stopColor="#8a6a3a" stopOpacity="0" />
          <stop offset="1" stopColor="#8a6a3a" stopOpacity="0.18" />
        </radialGradient>
        <rect width={width} height={height} fill={`url(#${id}-edge)`} />
      </svg>
    </AbsoluteFill>
  );
};
