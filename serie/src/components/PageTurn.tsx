import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {palette} from '../theme';

/**
 * Buchseite umblättern: die alte Seite (`from`) wird von rechts nach links
 * umgeschlagen, ihre Rückseite wandert mit, darunter erscheint `to`.
 * progress 0..1.
 */
export const PageTurn: React.FC<{
  progress: number;
  from: React.ReactNode;
  to: React.ReactNode;
  backColor?: string;
}> = ({progress, from, to, backColor = palette.paper}) => {
  const {width: W, height: H} = useVideoConfig();
  if (progress <= 0) return <AbsoluteFill>{from}</AbsoluteFill>;
  if (progress >= 1) return <AbsoluteFill>{to}</AbsoluteFill>;
  const p = progress;
  // Falzlinie leicht schräg (unten voraus)
  const tilt = 0.18 * W * Math.sin(p * Math.PI);
  const xt = W * (1 - p) + tilt * 0.5; // Falz oben
  const xb = W * (1 - p) - tilt * 0.5; // Falz unten
  // Rückseite: Spiegelung des umgeschlagenen Teils an der Falzlinie
  const bt = xt - (W - xt);
  const bb = xb - (W - xb);
  const shadow = Math.sin(p * Math.PI);
  return (
    <AbsoluteFill>
      <AbsoluteFill>{to}</AbsoluteFill>
      <AbsoluteFill style={{clipPath: `polygon(0 0, ${xt}px 0, ${xb}px ${H}px, 0 ${H}px)`}}>{from}</AbsoluteFill>
      {/* Schlagschatten auf der neuen Seite */}
      <AbsoluteFill
        style={{
          clipPath: `polygon(${xt}px 0, ${W}px 0, ${W}px ${H}px, ${xb}px ${H}px)`,
          background: `linear-gradient(90deg, rgba(40,20,5,${0.45 * shadow}) 0%, rgba(40,20,5,0) 22%)`,
        }}
      />
      {/* Rückseite der Seite */}
      <AbsoluteFill
        style={{
          clipPath: `polygon(${Math.max(bt, -W)}px 0, ${xt}px 0, ${xb}px ${H}px, ${Math.max(bb, -W)}px ${H}px)`,
          background: `linear-gradient(90deg, ${backColor} 0%, #e6d5ae 70%, #c9b183 100%)`,
          boxShadow: 'inset 0 0 40px rgba(60,30,10,0.4)',
        }}
      />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <path d={`M${xt},0 L${xb},${H}`} stroke={palette.ink} strokeWidth={2.4} />
        <path d={`M${Math.max(bt, -W)},0 L${Math.max(bb, -W)},${H}`} stroke={palette.ink} strokeWidth={2} opacity={0.8} />
      </svg>
    </AbsoluteFill>
  );
};
