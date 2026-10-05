import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {Dove} from '../components/Dove';
import {Sparkle} from '../components/DoodleFX';
import {useScene} from '../components/Episode';
import {Karima, KARIMA_HEAD, blinkAt} from '../components/Karima';
import {Pablo} from '../components/Pablo';
import {Bakery} from '../components/Props';
import {GROUND_Y, Town} from '../components/Town';
import {lerp, progress} from '../lib/anim';

/**
 * Folge 5 — Die Bäckerei taucht auf, Pablo staunt, Karima triumphiert;
 * zwei weiße Tauben flattern aus ihren Händen.
 */
export const Teil05: React.FC = () => {
  const {frame, cue} = useScene();
  const cOne = cue('one', 0, 'end');
  const cWalked = cue('walked');
  const cDoor = cue('door');
  const cParting = cue('parting');
  const cPigeons = cue('pigeons');

  const bakeryDraw = progress(frame, 0, cOne + 8, Easing.out(Easing.quad));
  const walk = progress(frame, cWalked - 4, cDoor + 6, Easing.inOut(Easing.sin));
  const walking = walk > 0 && walk < 1;
  const kx = lerp(170, 400, walk);
  const px = lerp(400, 600, walk);
  const doorOpen = progress(frame, cDoor, cDoor + 12);
  const release = progress(frame, cPigeons - 4, cPigeons + 40, (t) => t);
  const kHeadY = GROUND_Y + KARIMA_HEAD.y * 1.4;

  return (
    <AbsoluteFill>
      <svg width={1080} height={1920}>
        <Town id="t5-town" />
        <Bakery x={760} y={GROUND_Y + 10} scale={0.95} draw={bakeryDraw} doorOpen={doorOpen} id="t5-bakery" />
        {bakeryDraw > 0.2 && frame < cWalked
          ? [0, 1, 2, 3].map((i) => <Sparkle key={i} x={760 + Math.cos(i * 1.6 + frame * 0.05) * 260} y={1100 + Math.sin(i * 1.6) * 200} size={36} rotation={frame * 5} salt={`t5-sp${i}`} />)
          : null}
        <g transform={`translate(${px},${GROUND_Y + 20}) scale(1.25)`}>
          <Pablo
            pose={walking ? 'walk' : frame >= cParting ? 'offerHand' : 'stand'}
            expression={frame < cWalked ? 'surprised' : 'smile'}
            walkCycle={frame / 20}
            facing={frame >= cParting ? -1 : 1}
            lookX={frame < cWalked ? 1 : -0.8}
            lookY={frame < cWalked ? -0.6 : 0.3}
            blink={blinkAt(frame, [cDoor + 10], 7)}
          />
        </g>
        <g transform={`translate(${kx},${GROUND_Y}) scale(1.4)`}>
          <Karima
            pose={walking ? 'walk' : frame >= cParting ? 'reach' : 'hips'}
            expression={frame >= cParting ? 'happy' : 'laugh'}
            walkCycle={frame / 18}
            lookX={0.8}
            lookY={-0.4}
            handFront={frame >= cParting ? {x: 70, y: -260 - release * 60} : undefined}
          />
        </g>
        {release > 0
          ? [0, 1].map((i) => {
              const t = Math.max(0, release - i * 0.08);
              return (
                <Dove
                  key={i}
                  x={lerp(i ? px - 120 : kx + 90, i ? 300 : 820, t)}
                  y={lerp(kHeadY - 40, 420 + i * 120, Easing.out(Easing.quad)(t))}
                  size={1.6}
                  facing={i ? -1 : 1}
                  rotation={-18}
                  id={`t5-dove${i}`}
                />
              );
            })
          : null}
      </svg>
    </AbsoluteFill>
  );
};
