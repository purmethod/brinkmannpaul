import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {Dove} from '../components/Dove';
import {ThoughtBubble} from '../components/DoodleFX';
import {useScene} from '../components/Scene';
import {Pablo, PABLO_HEAD} from '../components/Pablo';
import {Pavilion, PocketWatch} from '../components/Props';
import {Rough} from '../components/Rough';
import {GROUND_Y, Town} from '../components/Town';
import {lerp, progress} from '../lib/anim';
import {palette} from '../theme';

const P_S = 1.05;

/** Folge 6 — Taube mit Brief fliegt über Dächer; Pablo im Pavillon schaut auf eine Taschenuhr. */
export const Szene06: React.FC = () => {
  const {frame, cue} = useScene();
  const cWaited = cue('waited');
  const cShe = cue('she');
  const cLate = cue('late');

  // Teil 1: Dächer von oben, Taube fliegt ab Frame 0
  const flight = progress(frame, 0, cWaited + 4, (t) => t);
  const pan = progress(frame, cWaited - 8, cWaited + 12, Easing.inOut(Easing.cubic));
  const watchUp = progress(frame, cShe - 4, cShe + 8, Easing.out(Easing.back(1.6)));
  const spin = progress(frame, cShe + 4, cLate + 20, Easing.in(Easing.quad)) * 3;
  const pHead = {x: 540, y: GROUND_Y + PABLO_HEAD.y * P_S};

  return (
    <AbsoluteFill>
      {/* Szene A: Dächer + Taube (schiebt nach oben weg) */}
      <AbsoluteFill style={{transform: `translateY(${-pan * 1920}px)`}}>
        <svg width={1080} height={1920}>
          <g transform="translate(0,620)">
            <Town castle={false} sky={false} id="t6-roofs" />
          </g>
          <Dove x={lerp(-120, 1200, flight)} y={700 + Math.sin(flight * 6) * 80} size={2} rotation={-6} letter id="t6-dove" />
        </svg>
      </AbsoluteFill>
      {/* Szene B: Pavillon vor dem Schloss (kommt von unten) */}
      <AbsoluteFill style={{transform: `translateY(${(1 - pan) * 1920}px)`}}>
        <svg width={1080} height={1920}>
          {/* großes Schloss */}
          <Rough
            shape={{kind: 'path', d: 'M180,1200 L180,760 L240,760 L240,700 L290,700 L290,760 L380,760 L380,560 L450,440 L520,560 L520,640 L600,640 L600,560 L660,460 L720,560 L720,760 L800,760 L800,700 L850,700 L850,760 L900,760 L900,1200 Z'}}
            salt="t6-castle"
            base={palette.paper}
            fill={palette.rosa}
            hachureGap={7}
            strokeWidth={3}
          />
          {[[450, 440], [660, 460]].map(([fx, fy], i) => (
            <Rough key={i} shape={{kind: 'path', d: `M${fx},${fy} L${fx},${fy - 60} L${fx + 34},${fy - 48} L${fx},${fy - 36}`}} salt={`t6-flag${i}`} stroke={palette.rosenrot} strokeWidth={3} />
          ))}
          <Rough shape={{kind: 'path', d: 'M-20,1200 Q540,1160 1100,1200 L1100,1260 L-20,1260 Z'}} salt="t6-hill" base={palette.paper} fill={palette.salbei} hachureGap={9} strokeWidth={2.4} />
          <Pavilion x={540} y={GROUND_Y + 20} scale={1.05} id="t6-pav" />
          <g transform={`translate(540,${GROUND_Y}) scale(${P_S})`}>
            <Pablo
              pose="stand"
              withStick={false}
              expression={frame >= cLate ? 'sad' : 'thoughtful'}
              handFront={{x: lerp(80, 70, watchUp), y: lerp(-300, -470, watchUp)}}
              lookX={0.5}
              lookY={frame >= cShe ? 0.7 : 0}
              headTilt={frame >= cShe ? 8 : 0}
            />
          </g>
          <PocketWatch x={540 + lerp(80, 70, watchUp) * P_S} y={GROUND_Y - lerp(300, 470, watchUp) * P_S} size={0.9} spin={spin} id="t6-watch-small" />
          <ThoughtBubble x={540} y={pHead.y - 420} fromX={pHead.x + 40} fromY={pHead.y - 140} w={300} h={300} appear={progress(frame, cShe + 2, cShe + 14)} id="t6-tb">
            <PocketWatch x={0} y={0} size={2.2} spin={spin} id="t6-watch-big" />
          </ThoughtBubble>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
