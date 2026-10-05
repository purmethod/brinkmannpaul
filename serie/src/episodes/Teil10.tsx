import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {Rain, Sparkle} from '../components/DoodleFX';
import {useScene} from '../components/Episode';
import {Karima, blinkAt} from '../components/Karima';
import {Pablo} from '../components/Pablo';
import {ColorWash, KnockWaves, WindowView} from '../components/Props';
import {Rough} from '../components/Rough';
import {Rose} from '../components/Vines';
import {lerp, progress} from '../lib/anim';
import {palette} from '../theme';

/**
 * Folge 10 — Karima am Fenster im Regen; Klopfen; Pablo steht draußen und versteckt
 * etwas hinter dem Rücken.
 */
export const Teil10: React.FC = () => {
  const {frame, cue} = useScene();
  const cMeant = cue('meant');
  const cBack = cue('back', 0, 'end');
  const cWords = cue('words');
  const cGestures = cue('gestures');

  const knock1 = progress(frame, cBack - 10, cBack + 4, (t) => t);
  const knock2 = progress(frame, cBack, cBack + 14, (t) => t);
  const pablo = progress(frame, cBack + 2, cBack + 16, Easing.out(Easing.quad));
  const peek = progress(frame, cGestures - 4, cGestures + 12, Easing.out(Easing.back(2)));
  const startled = frame >= cBack - 6;
  const warm = progress(frame, cGestures, cGestures + 20);

  return (
    <AbsoluteFill>
      <svg width={1080} height={1920}>
        {/* Innenwand */}
        <Rough shape={{kind: 'rect', x: -20, y: -20, w: 1120, h: 1960}} salt="t10-wall" base={palette.paperDark} fill={palette.rosa} hachureGap={22} hachureAngle={90} fillWeight={1} strokeWidth={0} stroke="transparent" />
        <WindowView x={540} y={760} w={620} h={760} id="t10-win">
          {/* draußen: nasse Gasse */}
          <rect x={-310} y={-380} width={620} height={760} fill="#b8c4cc" />
          <Rough shape={{kind: 'path', d: 'M-320,240 Q0,200 320,240 L320,400 L-320,400 Z'}} salt="t10-street" base="#9aa6ad" strokeWidth={2} />
          {pablo > 0 ? (
            <g transform={`translate(${lerp(260, 40, pablo)},380) scale(0.95)`}>
              <Pablo pose="stand" withStick={false} expression="smile" handFront={{x: -50, y: -190}} handBack={{x: -60, y: -186}} lookX={0} lookY={-0.3} id="t10-pablo" />
              {peek > 0 ? (
                <g transform={`translate(${-95},${-200 - peek * 40}) scale(${peek})`}>
                  <Rose x={0} y={0} size={1.4} salt="t10-rose" />
                </g>
              ) : null}
            </g>
          ) : null}
          <g transform="translate(-310,-380)">
            <Rain w={620} h={760} amount={50} id="t10-rain" />
          </g>
        </WindowView>
        <KnockWaves x={850} y={700} t={knock1} id="t10-k1" />
        <KnockWaves x={850} y={820} t={knock2} id="t10-k2" />
        {/* Karima drinnen, von hinten-seitlich am Fenster */}
        <g transform="translate(300,1900) scale(1.9)">
          <Karima
            pose={startled ? 'stand' : 'heart'}
            expression={frame >= cGestures ? 'happy' : startled ? 'wonder' : 'sad'}
            lookX={startled ? 0.9 : 0.6}
            lookY={-0.9}
            headTilt={startled ? 0 : 12}
            blink={blinkAt(frame, [cMeant + 4, cWords + 6], 9)}
          />
        </g>
        {peek > 0.6 ? <Sparkle x={520} y={1000} size={40} rotation={frame * 5} salt="t10-sp" /> : null}
        <ColorWash color={palette.nightBlue} amount={0.25 * (1 - warm)} />
        <ColorWash color={palette.senf} amount={0.12 * warm} blend="soft-light" />
      </svg>
    </AbsoluteFill>
  );
};
