import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {useScene} from '../components/Scene';
import {Karima} from '../components/Karima';
import {Pablo} from '../components/Pablo';
import {ColorWash, Envelope} from '../components/Props';
import {Rough} from '../components/Rough';
import {lerp, progress} from '../lib/anim';
import {palette} from '../theme';

/**
 * Folge 9 — Pablos Silhouette verschwindet am Horizont; eine Einladung mit Siegel flattert
 * zu ihr, sie legt sie weg; die Farbe kippt grau-blau.
 */
export const Szene09: React.FC = () => {
  const {frame, cue} = useScene();
  const cWord = cue('word', 0, 'end');
  const cInvited = cue('invited');
  const cBut = cue('But');
  const cGo = cue('go', 0, 'end');

  // Pablo geht ab Frame 0 den Weg zum Horizont hinauf und wird kleiner
  const away = progress(frame, 0, cWord + 6, (t) => t);
  const py = lerp(1500, 1010, Easing.out(Easing.quad)(away));
  const ps = lerp(1.1, 0.12, away);
  const env = progress(frame, cInvited - 6, cInvited + 22, Easing.out(Easing.quad));
  const putAway = progress(frame, cBut + 2, cGo, Easing.inOut(Easing.cubic));
  const grey = progress(frame, cBut - 6, cGo + 10);

  const handX = 300 + 90 * 1.15;
  const handY = 1650 - 400 * 1.15;
  const ex = putAway > 0 ? lerp(handX, 140, putAway) : lerp(900, handX, env);
  const ey = putAway > 0 ? lerp(handY, 1720, putAway) : lerp(300, handY, env) + Math.sin(env * Math.PI * 4) * 60 * (1 - env);

  return (
    <AbsoluteFill>
      <svg width={1080} height={1920}>
        {/* Landschaft: Weg zum Horizont */}
        <Rough shape={{kind: 'path', d: 'M-20,1000 C200,940 380,960 540,1000 C700,950 880,940 1100,990 L1100,1080 L-20,1080 Z'}} salt="t9-hills" base={palette.paper} fill={palette.salbei} hachureGap={9} strokeWidth={2.2} />
        <Rough shape={{kind: 'curve', points: [[300, 1920], [500, 1500], [520, 1200], [545, 1010]]}} salt="t9-pathL" strokeWidth={2.6} />
        <Rough shape={{kind: 'curve', points: [[960, 1920], [700, 1500], [590, 1200], [560, 1010]]}} salt="t9-pathR" strokeWidth={2.6} />
        {away < 1 ? (
          <g transform={`translate(${lerp(640, 552, away)},${py}) scale(${ps})`} opacity={1 - progress(frame, cWord - 6, cWord + 6)}>
            <Pablo pose="walk" facing={-1} walkCycle={frame / 18} expression="thoughtful" />
          </g>
        ) : null}
        <g transform="translate(300,1650) scale(1.15)">
          <Karima
            pose={env >= 1 && putAway < 1 ? 'reach' : 'stand'}
            expression={frame >= cBut ? 'sad' : env > 0 ? 'curious' : 'sad'}
            facing={1}
            lookX={env > 0 && putAway < 0.3 ? 0.7 : 0.4}
            lookY={putAway > 0 ? 0.8 : -0.5}
            headTilt={frame >= cBut ? 10 : 0}
            handFront={env > 0.95 && putAway < 0.5 ? {x: 90, y: -400} : undefined}
          />
        </g>
        {env > 0 ? <Envelope x={ex} y={ey} size={1.1} rotation={putAway > 0 ? lerp(0, -30, putAway) : Math.sin(frame * 0.3) * 20 * (1 - env)} id="t9-env" /> : null}
        <ColorWash color={palette.nightBlue} amount={grey * 0.45} />
        <ColorWash color="#888" amount={grey * 0.6} blend="color" />
      </svg>
    </AbsoluteFill>
  );
};
