import React from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {blinkAt, Kenza} from '../components/characters/Kenza';
import {PaperTexture} from '../components/effects/PaperTexture';
import {VintageFilm} from '../components/effects/VintageFilm';
import {Butterfly} from '../components/props/Butterfly';
import {House} from '../components/scenery/House';
import {PageTurn} from '../components/transitions/PageTurn';
import {progress} from '../lib/anim';
import {palette} from '../theme';

const Label: React.FC<{x: number; y: number; children: string}> = ({x, y, children}) => (
  <text x={x} y={y} textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize={24} fill={palette.inkSoft}>
    {children}
  </text>
);

/** Charakterblatt: Kenza in Posen/Ausdrücken + Bausteine. Zum Begutachten der Figur. */
const Sheet: React.FC = () => {
  const frame = useCurrentFrame();
  const blink = blinkAt(frame, [20, 70], 7);
  return (
    <AbsoluteFill>
      <PaperTexture id="sheet-paper" />
      <AbsoluteFill>
      <svg width={1080} height={1080}>
        <g transform="translate(150,470) scale(0.95)">
          <Kenza pose="stand" expression="happy" blink={blink} id="k1" />
        </g>
        <Label x={150} y={520}>stand · happy</Label>
        <g transform="translate(410,470) scale(0.95)">
          <Kenza pose="walk" walkCycle={frame / 17} expression="happy" withSuitcase id="k2" />
        </g>
        <Label x={410} y={520}>walk + koffer</Label>
        <g transform="translate(680,470) scale(0.95)">
          <Kenza pose="wonder" expression="wonder" lookY={-0.6} id="k3" />
        </g>
        <Label x={680} y={520}>wonder</Label>
        <g transform="translate(920,470) scale(0.95)">
          <Kenza pose="reach" expression="curious" lookX={0.8} lookY={-0.8} id="k4" />
        </g>
        <Label x={920} y={520}>reach · curious</Label>
        <House id="sheet-h1" x={230} y={1000} w={200} h={300} skew={24} color={palette.senf} face={0} />
        <House id="sheet-h2" x={540} y={1000} w={200} h={300} skew={-20} color={palette.rosa} roofColor={palette.salbei} face={1} lean={-6} whisper={1} />
        <Butterfly x={840} y={780} size={1.6} id="sheet-b" />
        <Label x={230} y={1050}>haus</Label>
        <Label x={540} y={1050}>haus mit gesicht</Label>
        <Label x={840} y={880}>schmetterling</Label>
      </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Bausteine: React.FC = () => {
  const frame = useCurrentFrame();
  const turn = progress(frame, 75, 110, Easing.inOut(Easing.cubic));
  return (
    <VintageFilm>
      <PageTurn
        progress={turn}
        from={<Sheet />}
        to={
          <AbsoluteFill>
            <PaperTexture id="sheet-paper2" />
          </AbsoluteFill>
        }
      />
    </VintageFilm>
  );
};
