import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {Puff, SpeedLines} from '../components/DoodleFX';
import {useScene} from '../components/Episode';
import {Karima, KARIMA_HEAD, blinkAt} from '../components/Karima';
import {Pablo} from '../components/Pablo';
import {ColorWash, InnTable, Sun} from '../components/Props';
import {GROUND_Y, Town} from '../components/Town';
import {lerp, progress} from '../lib/anim';
import {palette} from '../theme';

/**
 * Folge 7 — Karima rennt keuchend an; die Sonne rast über den Himmel; geteiltes Brot im
 * Gasthaus; Heimweg, sie dreht sich lächelnd um.
 */
export const Teil07: React.FC = () => {
  const {frame, cue} = useScene();
  const cBreath = cue('breath', 0, 'end');
  const cHour = cue('hour');
  const cFour = cue('four');
  const cWay = cue('way');
  const cThought = cue('thought');

  const run = progress(frame, 0, cBreath - 6, Easing.out(Easing.quad));
  const running = run < 1;
  const sunT = progress(frame, cHour - 6, cFour + 10, Easing.inOut(Easing.sin));
  const inn = progress(frame, cHour - 6, cHour + 8);
  const home = progress(frame, cWay - 8, cWay + 6);
  const walkAway = progress(frame, cWay - 4, cThought + 6, (t) => t);
  const turned = frame >= cThought - 4;

  const kx = home > 0 ? lerp(420, 780, walkAway) : lerp(-160, 360, run);
  const kHeadY = GROUND_Y + KARIMA_HEAD.y * 1.08;

  return (
    <AbsoluteFill>
      <svg width={1080} height={1920}>
        <Town id="t7-town" />
        {/* Sonne rast im Bogen über den Himmel */}
        <Sun x={lerp(80, 1000, sunT)} y={700 - Math.sin(sunT * Math.PI) * 420} size={1.1} id="t7-sun" />
        {inn > 0 && home < 1 ? (
          <g opacity={inn * (1 - home)}>
            <InnTable x={540} y={GROUND_Y + 10} scale={1.3} breadSplit={progress(frame, cFour - 4, cFour + 10)} id="t7-inn" />
          </g>
        ) : null}
        <g transform={`translate(${home > 0.5 ? 300 : 760},${GROUND_Y + 20}) scale(1.05)`} opacity={home > 0.5 ? 1 - progress(frame, cThought, cThought + 14) * 0.0 : 1}>
          <Pablo
            pose={home > 0.5 ? 'stand' : 'lean'}
            facing={-1}
            expression={home > 0.5 ? 'smirk' : 'smile'}
            lookX={-0.6}
            blink={blinkAt(frame, [cHour + 10], 7)}
          />
        </g>
        <g transform={`translate(${kx},${GROUND_Y}) scale(1.08)`}>
          <Karima
            pose={running || (home > 0 && walkAway < 1 && !turned) ? 'walk' : 'stand'}
            expression={running ? 'wonder' : turned ? 'flirt' : 'laugh'}
            blush={turned ? 0.9 : 0.3}
            walkCycle={frame / (running ? 9 : 18)}
            facing={home > 0 && !turned ? 1 : turned ? -1 : 1}
            lookX={turned ? -0.9 : 0.6}
            headTilt={turned ? -10 : running ? 10 : 0}
            capeWind={running ? 16 : 0}
            blink={blinkAt(frame, [cThought + 10], 7)}
          />
        </g>
        {running ? <SpeedLines x={kx - 90} y={GROUND_Y - 260} dir={1} length={140} id="t7-speed" /> : null}
        {/* keuchende Atemwölkchen */}
        {frame >= cBreath - 14 && frame < cBreath + 16 ? <Puff x={kx + 80} y={kHeadY + 20} t={((frame - (cBreath - 14)) % 15) / 15} size={0.5} id="t7-puff" /> : null}
        <ColorWash color={palette.nightBlue} amount={home * 0.28} />
      </svg>
    </AbsoluteFill>
  );
};
