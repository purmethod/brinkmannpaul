import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {Sparkle, ThoughtBubble} from '../components/DoodleFX';
import {useScene} from '../components/Scene';
import {Karima, KARIMA_HEAD, blinkAt} from '../components/Karima';
import {Pablo, PABLO_HEAD} from '../components/Pablo';
import {Bread} from '../components/Props';
import {GROUND_Y, Town} from '../components/Town';
import {progress} from '../lib/anim';

const K = {x: 300, s: 1.08};
const P = {x: 790, s: 1.08};

/** Folge 4 — Gedankenblasen: ihre zeigt ein Brot, seine ein durchgestrichenes Brot; Karima stemmt die Hände in die Hüften. */
export const Szene04: React.FC = () => {
  const {frame, cue} = useScene();
  const cHere = cue('here');
  const cLaughed = cue('laughed');
  const cBut = cue('But');
  const cCertain = cue('certain');
  const kHead = {x: K.x, y: GROUND_Y + KARIMA_HEAD.y * K.s};
  const pHead = {x: P.x, y: GROUND_Y + PABLO_HEAD.y * P.s};

  const herBubble = progress(frame, 0, 12, Easing.out(Easing.back(1.8)));
  const hisBubble = progress(frame, cue('There') - 4, cue('There') + 10, Easing.out(Easing.back(1.8)));
  const crossed = progress(frame, cHere - 2, cHere + 10);
  const laugh = frame >= cLaughed && frame < cBut;
  const certain = frame >= cBut - 2;
  const grow = 1 + 0.35 * progress(frame, cCertain - 4, cCertain + 10, Easing.out(Easing.back(2)));

  return (
    <AbsoluteFill>
      <svg width={1080} height={1920}>
        <Town id="t4-town" />
        <ThoughtBubble x={300} y={kHead.y - 360} fromX={kHead.x + 20} fromY={kHead.y - 110} w={330} h={240} appear={herBubble} id="t4-hb">
          <g transform={`scale(${grow})`}>
            <Bread x={0} y={10} size={1.2} id="t4-bread1" />
          </g>
        </ThoughtBubble>
        <ThoughtBubble x={780} y={pHead.y - 330} fromX={pHead.x - 20} fromY={pHead.y - 120} w={300} h={220} appear={hisBubble} id="t4-pb">
          <Bread x={0} y={10} size={1} crossed={crossed} id="t4-bread2" />
        </ThoughtBubble>
        <g transform={`translate(${K.x},${GROUND_Y}) scale(${K.s})`}>
          <Karima
            pose={certain ? 'hips' : 'reach'}
            expression={certain ? 'cross' : 'happy'}
            lookX={certain ? 0.9 : 0.3}
            lookY={certain ? 0 : -0.8}
            headTilt={certain ? -8 : 4}
            handFront={certain ? undefined : {x: 80, y: -480 - Math.abs(Math.sin(frame * 0.3)) * 24}}
            blush={laugh ? 0.5 : 0}
            blink={blinkAt(frame, [cLaughed + 4], 7)}
          />
        </g>
        <g transform={`translate(${P.x},${GROUND_Y + 20}) scale(${P.s})`}>
          <Pablo
            pose="lean"
            facing={-1}
            expression={laugh ? 'talk' : certain ? 'smirk' : 'grin'}
            talk={laugh ? Math.abs(Math.sin(frame * 0.6)) : 0}
            shake={laugh ? Math.sin(frame * 0.9) * 0.25 : 0}
            lookX={-0.8}
            blink={blinkAt(frame, [cue('said')], 7)}
          />
        </g>
        {certain
          ? [0, 1, 2].map((i) => (
              <Sparkle key={i} x={300 + Math.cos(i * 2.1) * 200} y={kHead.y - 360 + Math.sin(i * 2.1) * 120} size={34 * progress(frame, cCertain + i * 3, cCertain + 10 + i * 3)} rotation={frame * 4} salt={`t4-sp${i}`} />
            ))
          : null}
      </svg>
    </AbsoluteFill>
  );
};
