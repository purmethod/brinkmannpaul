import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {QuestionMark, ShadowEyes} from '../components/DoodleFX';
import {useScene} from '../components/Episode';
import {Karima, KARIMA_HEAD, blinkAt} from '../components/Karima';
import {Rough} from '../components/Rough';
import {TownMap} from '../components/TownMap';
import {GROUND_Y, Town} from '../components/Town';
import {lerp, overshoot, progress} from '../lib/anim';
import {palette} from '../theme';

const K_SCALE = 1.12;
const KX = 470;

/**
 * Folge 2 — Karima dreht den Stadtplan, die Gassen verknoten sich zum Knäuel;
 * aus dem Schatten blitzen zwei Augen unter einer Hutkrempe.
 */
export const Teil02: React.FC = () => {
  const {frame, cue} = useScene();
  const cSense = cue('sense');
  const cDirection = cue('direction');
  const cLost = cue('lost');
  const cRight = cue('right');
  const cEyes = cue('eyes');
  const cStranger = cue('stranger');

  // Karte dreht sich ab Frame 0 (Hook), ruckartig bei "sense" und "direction"
  const turn1 = overshoot(progress(frame, cSense - 2, cSense + 10, (t) => t), 1.8);
  const turn2 = overshoot(progress(frame, cDirection - 2, cDirection + 10, (t) => t), 1.8);
  const mapRot = Math.sin(frame * 0.35) * 14 * (1 - progress(frame, 0, 20)) + turn1 * 90 + turn2 * 180;
  const knot = progress(frame, cLost - 6, cLost + 26, Easing.inOut(Easing.cubic));
  const dark = progress(frame, cRight - 6, cRight + 10);
  const eyesOpen = progress(frame, cEyes - 2, cEyes + 6, Easing.out(Easing.back(2)));
  const noticed = frame >= cEyes + 4;

  const headY = GROUND_Y + KARIMA_HEAD.y * K_SCALE;
  const lookX = noticed ? 1 : frame >= cLost ? Math.sin(frame * 0.3) : -0.2;
  const qms = frame < cRight;

  return (
    <AbsoluteFill>
      <svg width={1080} height={1920}>
        <Town knot={knot} lean={knot * 0.6 * Math.sin(frame * 0.15)} id="t2-town" />
        {/* Schattengasse rechts */}
        <g opacity={dark}>
          <Rough
            shape={{kind: 'path', d: 'M790,1560 L790,1150 C790,1040 1050,1040 1050,1150 L1050,1560 Z'}}
            salt="t2-shadow"
            base={'#4a382b'}
            fill={palette.ink}
            fillStyle="cross-hatch"
            hachureGap={6}
            strokeWidth={3}
          />
        </g>
        {dark > 0.5 ? <ShadowEyes x={920} y={1260} open={eyesOpen} lookX={-0.8} size={1.15} id="t2-eyes" /> : null}

        <g transform={`translate(${KX},${GROUND_Y}) scale(${K_SCALE})`}>
          <Karima
            pose="map"
            expression={noticed ? (frame >= cStranger + 6 ? 'flirt' : 'wonder') : frame >= cLost ? 'confused' : 'curious'}
            blush={noticed ? progress(frame, cStranger, cStranger + 14) * 0.8 : 0}
            lookX={lookX}
            lookY={noticed ? -0.1 : 0.5}
            headTilt={noticed ? 8 : Math.sin(frame * 0.12) * 8}
            blink={blinkAt(frame, [cDirection + 12], 7)}
            holding={<TownMap rotation={mapRot} id="t2-map" />}
          />
        </g>
        {qms
          ? [0, 1, 2].map((i) => {
              const born = cSense + i * 10;
              const t = progress(frame, born, born + 16, Easing.out(Easing.back(2)));
              const a = i * 2.1 + frame * 0.04;
              return t > 0 ? (
                <QuestionMark key={i} x={KX + Math.cos(a) * 190} y={headY - 170 + Math.sin(a) * 40} size={60 * t} rotation={Math.sin(frame * 0.2 + i) * 18} color={i === 1 ? palette.rosenrot : palette.ink} salt={`t2-q${i}`} />
              ) : null;
            })
          : null}
        {/* Erschreck-Striche beim Bemerken */}
        {noticed && frame < cStranger + 20 ? (
          <g opacity={1 - progress(frame, cStranger + 6, cStranger + 20)}>
            <Rough shape={{kind: 'path', d: `M${KX + 120},${headY - 120} l30,-30 M${KX + 140},${headY - 80} l40,-10 M${KX + 110},${headY - 150} l10,-40`}} salt="t2-shock" strokeWidth={3.4} />
          </g>
        ) : null}
        {/* Schwankende Vignette beim Verirren */}
        <rect x={0} y={0} width={1080} height={1920} fill={palette.ink} opacity={lerp(0, 0.12, knot) * (1 - dark * 0.5)} />
      </svg>
    </AbsoluteFill>
  );
};
