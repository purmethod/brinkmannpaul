import React from 'react';
import {palette} from '../theme';
import {Rough} from './Rough';

/**
 * Rotes Band: zeichnet sich entlang eines Pfads (draw 0..1). Mit `heart` endet es in
 * einer Herzschleife zwischen zwei Punkten (Folge 23).
 */
export const RedRibbon: React.FC<{d?: string; from?: [number, number]; to?: [number, number]; heart?: boolean; draw?: number; width?: number; id?: string}> = ({
  d,
  from = [0, 0],
  to = [300, 0],
  heart = false,
  draw = 1,
  width = 7,
  id = 'ribbon',
}) => {
  const mx = (from[0] + to[0]) / 2;
  const my = (from[1] + to[1]) / 2;
  const path =
    d ??
    (heart
      ? `M${from[0]},${from[1]} C${mx - 120},${my + 40} ${mx - 90},${my - 110} ${mx},${my - 40} C${mx + 90},${my - 110} ${mx + 120},${my + 40} ${to[0]},${to[1]}`
      : `M${from[0]},${from[1]} C${mx},${my - 60} ${mx},${my + 60} ${to[0]},${to[1]}`);
  return (
    <g>
      <Rough shape={{kind: 'path', d: path}} salt={`${id}-a`} stroke={palette.rosenrot} strokeWidth={width} roughness={0.9} draw={draw} multiStroke={false} />
      <Rough shape={{kind: 'path', d: path}} salt={`${id}-b`} stroke={palette.ink} strokeWidth={1.4} roughness={1.1} draw={draw} />
    </g>
  );
};
