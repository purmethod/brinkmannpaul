import React from 'react';
import {palette} from '../../theme';
import {Rough} from '../rough/Rough';

type Pt = {x: number; y: number};

export type HoseLimbProps = {
  from: Pt;
  to: Pt;
  /** Biegung senkrecht zur Strecke (px, Vorzeichen = Richtung). */
  bend: number;
  /** Außendurchmesser des Schlauchs. */
  thickness?: number;
  /** Innenfarbe; ohne = komplett Tusche (schwarze Strümpfe). */
  color?: string;
  salt: string;
};

/** Quadratische Kontrollpunkt-Berechnung für eine gleichmäßig gebogene Gummischlauch-Linie. */
export const hoseControl = (from: Pt, to: Pt, bend: number): Pt => {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return {x: mx + (-dy / len) * bend * 2, y: my + (dx / len) * bend * 2};
};

/**
 * Rubber-Hose-Glied: biegsamer Schlauch ohne Ellbogen/Knie, gleichmäßig dick,
 * mit Tusche-Kontur und wackeliger Doppellinie darüber.
 */
export const HoseLimb: React.FC<HoseLimbProps> = ({from, to, bend, thickness = 13, color, salt}) => {
  const c = hoseControl(from, to, bend);
  const d = `M${from.x},${from.y} Q${c.x},${c.y} ${to.x},${to.y}`;
  return (
    <g>
      <path d={d} stroke={palette.ink} strokeWidth={thickness} fill="none" strokeLinecap="round" />
      {color ? (
        <path d={d} stroke={color} strokeWidth={thickness - 5} fill="none" strokeLinecap="round" />
      ) : null}
      <Rough
        shape={{kind: 'path', d}}
        salt={salt}
        strokeWidth={1.6}
        roughness={0.9}
        bowing={0.6}
        stroke={palette.ink}
      />
    </g>
  );
};
