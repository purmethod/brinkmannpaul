import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {palette} from '../theme';
import {Heart} from './DoodleFX';
import {Karima, blinkAt} from './Karima';
import {Pablo} from './Pablo';
import {Paper} from './Paper';
import {VintageOverlay} from './VintageOverlay';

const Label: React.FC<{x: number; y: number; children: string}> = ({x, y, children}) => (
  <text x={x} y={y} textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize={26} fill={palette.inkSoft}>
    {children}
  </text>
);

/** Figurenblatt zur Freigabe: Karima + Pablo in Posen/Ausdrücken, zusammen. */
export const CharacterSheet: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <VintageOverlay>
      <Paper id="sheet" />
      <AbsoluteFill>
        <svg width={1080} height={1920}>
          <g transform="translate(180,700) scale(1.05)">
            <Karima pose="braid" expression="flirt" lookX={0.7} blush={0.6} blink={blinkAt(frame, [40], 7)} id="cs-k1" />
          </g>
          <Label x={180} y={750}>karima · flirt</Label>
          <g transform="translate(540,700) scale(1.05)">
            <Karima pose="walk" walkCycle={frame / 22} expression="happy" capeWind={8} id="cs-k2" />
          </g>
          <Label x={540} y={750}>walk</Label>
          <g transform="translate(880,700) scale(1.05)">
            <Karima pose="hips" expression="cross" hood id="cs-k3" />
          </g>
          <Label x={880} y={750}>drama · kapuze</Label>
          <g transform="translate(250,1420) scale(1.05)">
            <Pablo pose="hipHand" expression="smirk" lookX={0.6} id="cs-p1" />
          </g>
          <Label x={250} y={1470}>pablo · smirk</Label>
          <g transform="translate(560,1420) scale(1.05)">
            <Pablo pose="tipHat" expression="wink" facing={-1} lookX={-0.5} id="cs-p2" />
          </g>
          <Label x={560} y={1470}>tip hat · wink</Label>
          <g transform="translate(860,1420) scale(1.05)">
            <Pablo pose="walk" walkCycle={frame / 20} expression="grin" id="cs-p3" />
          </g>
          <Label x={860} y={1470}>walk</Label>
          {/* zusammen */}
          <g transform="translate(420,1880) scale(0.62)">
            <Karima pose="heart" expression="dreamy" blush={1} headTilt={12} id="cs-k4" />
          </g>
          <g transform="translate(600,1880) scale(0.62)">
            <Pablo pose="stand" expression="smile" facing={-1} lookX={-0.8} lookY={0.4} headTilt={-6} withStick={false} id="cs-p4" />
          </g>
          <Heart x={510} y={1500} size={50} salt="cs-heart" />
        </svg>
      </AbsoluteFill>
    </VintageOverlay>
  );
};
