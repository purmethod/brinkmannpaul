import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {Birds} from '../components/DoodleFX';
import {useScene} from '../components/Episode';
import {Fence, Rope} from '../components/Fence';
import {Karima, blinkAt} from '../components/Karima';
import {Pablo} from '../components/Pablo';
import {TownMap} from '../components/TownMap';
import {GROUND_Y, Town} from '../components/Town';
import {lerp, progress} from '../lib/anim';

const P_SCALE = 1.12;
const K_SCALE = 0.95;

/**
 * Folge 3 — Pablo schlendert ins Bild, ein Vogelschwarm fliegt auf, ein Seil am Zaun
 * will sich um ihn wickeln, er schüttelt es ab und tippt an den Hut: "Where to?"
 */
export const Teil03: React.FC = () => {
  const {frame, cue} = useScene();
  const cWanderer = cue('wanderer');
  const cWild = cue('wild');
  const cTied = cue('tied');
  const cDown = cue('down', 0, 'end');
  const cWhere = cue('Where');
  const cAsked = cue('asked', 0, 'end');

  // Pablo schlendert ab Frame 0 von rechts herein (Hook)
  const walkIn = progress(frame, 0, cWanderer + 18, Easing.out(Easing.sin));
  const px = lerp(1260, 650, walkIn);
  const strolling = walkIn < 1;

  // Seil: kriecht heran, wickelt sich, wird abgeschüttelt
  const reach = progress(frame, cTied - 14, cTied + 4, Easing.out(Easing.quad));
  const wrap = progress(frame, cTied + 2, cTied + 12);
  const shakeT = progress(frame, cDown - 4, cDown + 22, (t) => t);
  const shake = shakeT > 0 && shakeT < 1 ? Math.sin(shakeT * Math.PI * 7) * (1 - shakeT) : 0;
  const drop = progress(frame, cDown + 4, cDown + 24, Easing.in(Easing.quad));

  // Karima schiebt sich links ins Bild, kurz bevor er fragt
  const kIn = progress(frame, cWhere - 26, cWhere - 4, Easing.out(Easing.back(1.4)));
  const kx = lerp(-160, 220, kIn);
  const asking = frame >= cWhere - 4;
  const talk = frame >= cWhere && frame <= cue('to', 0, 'end') ? Math.abs(Math.sin(frame * 0.7)) : 0;

  return (
    <AbsoluteFill>
      <svg width={1080} height={1920}>
        <Town id="t3-town" />
        <Birds x={820} y={1120} t={progress(frame, cWild - 4, cWild + 40, (t) => t) * 1.3} count={9} id="t3-birds" />
        <Fence x={70} y={GROUND_Y + 10} posts={3} gap={110} h={170} id="t3-fence" />
        <g transform={`translate(${px},${GROUND_Y + 30}) scale(${P_SCALE})`}>
          <Pablo
            pose={asking ? 'tipHat' : strolling ? 'stroll' : 'stand'}
            expression={frame > cAsked ? 'wink' : asking ? 'talk' : drop > 0 ? 'grin' : wrap > 0.5 ? 'surprised' : 'smirk'}
            talk={talk}
            walkCycle={frame / 22}
            facing={-1}
            shake={shake}
            lookX={asking ? -0.9 : wrap > 0 ? 0.6 : -0.4}
            lookY={asking ? 0.5 : 0}
            blink={blinkAt(frame, [cWanderer + 6, cWhere - 20], 7)}
          />
        </g>
        <Rope
          from={{x: 290, y: GROUND_Y - 90}}
          to={{x: px, y: GROUND_Y + 30 - 330 * P_SCALE}}
          reach={reach}
          wrap={wrap}
          drop={drop}
          girth={90 * P_SCALE}
          id="t3-rope"
        />
        {kIn > 0 ? (
          <g transform={`translate(${kx},${GROUND_Y + 60}) scale(${K_SCALE})`}>
            <Karima
              pose={frame > cAsked ? 'braid' : 'map'}
              expression={frame > cAsked ? 'flirt' : 'wonder'}
              blush={progress(frame, cAsked, cAsked + 12) * 0.9}
              lookX={0.9}
              lookY={-0.7}
              headTilt={6}
              holding={frame > cAsked ? undefined : <TownMap rotation={-8} id="t3-map" />}
              blink={blinkAt(frame, [cAsked + 4], 7)}
              id="t3-karima"
            />
          </g>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};
