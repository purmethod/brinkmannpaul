import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {Heart} from '../components/DoodleFX';
import {useScene} from '../components/Episode';
import {Karima, KARIMA_HEAD, blinkAt} from '../components/Karima';
import {Pablo} from '../components/Pablo';
import {CookingPot, StrawberryBasket} from '../components/Props';
import {Rough} from '../components/Rough';
import {lerp, progress} from '../lib/anim';
import {palette} from '../theme';

const FLOOR = 1560;

/** Küche: Holzboden, Wand mit Fenster, Tür rechts. */
const Kitchen: React.FC<{doorLight: number}> = ({doorLight}) => (
  <g>
    <Rough shape={{kind: 'rect', x: -20, y: FLOOR, w: 1120, h: 400}} salt="t8-floor" base={palette.paperDark} fill={palette.wood} hachureGap={14} hachureAngle={80} strokeWidth={2.4} />
    <Rough shape={{kind: 'rect', x: 120, y: 560, w: 300, h: 360}} salt="t8-window" base={'#cfe0e6'} strokeWidth={6} multiStroke={false} />
    <Rough shape={{kind: 'path', d: 'M270,560 L270,920 M120,740 L420,740'}} salt="t8-bars" strokeWidth={5} multiStroke={false} />
    {/* Tür rechts, einen Spalt offen, Licht fällt herein */}
    <Rough shape={{kind: 'rect', x: 840, y: 900, w: 240, h: 660}} salt="t8-doorframe" base={palette.senf} strokeWidth={4} />
    <polygon points={`840,1560 1080,1560 1080,${1560 + 200 * doorLight} 700,${1560 + 260 * doorLight}`} fill={palette.senf} opacity={0.35 * doorLight} />
    <Rough shape={{kind: 'polygon', points: [[840, 900], [940, 940], [940, 1600], [840, 1560]]}} salt="t8-door" base={palette.paper} fill={palette.wood} hachureGap={6} strokeWidth={3} />
    <Rough shape={{kind: 'line', x1: -20, y1: 1220, x2: 820, y2: 1220}} salt="t8-counter-top" strokeWidth={3} />
    <Rough shape={{kind: 'rect', x: 40, y: 1220, w: 520, h: 340}} salt="t8-counter" base={palette.paper} fill={palette.salbei} hachureGap={10} strokeWidth={2.8} />
  </g>
);

/**
 * Folge 8 — Herzchen über Karima; Kochtopf dampft, Erdbeerkorb; Pablos Stiefel stehen
 * schon in Richtung Tür.
 */
export const Teil08: React.FC = () => {
  const {frame, cue} = useScene();
  const cCooked = cue('cooked');
  const cStraw = cue('strawberries');
  const cWanderer = cue('wanderer');
  const cStay = cue('stay', 0, 'end');

  const potIn = progress(frame, cCooked - 4, cCooked + 10, Easing.out(Easing.back(1.6)));
  const pIn = progress(frame, cue('he', 1) - 10, cStraw + 4, Easing.out(Easing.quad));
  const toDoor = frame >= cWanderer - 4;
  const zoom = progress(frame, cWanderer - 4, cWanderer + 14, Easing.inOut(Easing.cubic));
  const px = lerp(1200, 700, pIn) + progress(frame, cWanderer, cStay, (t) => t) * 60;
  const kHeadY = FLOOR + KARIMA_HEAD.y * 1.08;

  return (
    <AbsoluteFill style={{transform: `scale(${lerp(1, 1.5, zoom)})`, transformOrigin: `760px 1500px`}}>
      <svg width={1080} height={1920}>
        <Kitchen doorLight={zoom} />
        {potIn > 0 ? <CookingPot x={300} y={1200} size={potIn * 1.1} id="t8-pot" /> : null}
        <g transform={`translate(420,${FLOOR}) scale(1.08)`}>
          <Karima
            pose={frame >= cStraw ? 'heart' : 'stand'}
            expression={frame >= cStraw ? 'flirt' : 'dreamy'}
            blush={0.8}
            lookX={frame >= cStraw ? 0.9 : 0.2}
            lookY={frame < cCooked ? -0.6 : 0}
            headTilt={Math.sin(frame * 0.08) * 8}
            blink={frame < cCooked ? 0.95 * (0.5 + 0.5 * Math.sin(frame * 0.12)) : blinkAt(frame, [cStraw + 14], 7)}
          />
        </g>
        {/* Herzchen steigen ab Frame 0 */}
        {Array.from({length: 6}).map((_, i) => {
          const t = ((frame + i * 12) % 60) / 60;
          const fade = frame > cWanderer ? 1 - zoom : 1;
          return (
            <g key={i} opacity={(1 - t) * fade}>
              <Heart x={420 + Math.sin(t * 6 + i) * 60 + (i - 3) * 30} y={kHeadY - 120 - t * 300} size={34 + (i % 3) * 10} rotation={Math.sin(t * 5 + i) * 20} color={i % 2 ? palette.rosa : palette.rosenrot} salt={`t8-h${i}`} />
            </g>
          );
        })}
        {pIn > 0 ? (
          <g transform={`translate(${px},${FLOOR + 10}) scale(1.08)`}>
            <Pablo
              pose={pIn < 1 ? 'walk' : 'stand'}
              facing={toDoor ? 1 : -1}
              expression={toDoor ? 'thoughtful' : 'smirk'}
              walkCycle={frame / 20}
              withStick={false}
              withBundle
              lookX={toDoor ? -1 : -0.6}
              handFront={toDoor ? undefined : {x: 110, y: -340}}
            />
          </g>
        ) : null}
        {pIn > 0.4 && !toDoor ? <StrawberryBasket x={px - 110 * 1.08} y={FLOOR + 10 - 300 * 1.08} size={0.9} id="t8-basket" /> : null}
        {toDoor ? <StrawberryBasket x={600} y={1215} size={0.8} id="t8-basket2" /> : null}
      </svg>
    </AbsoluteFill>
  );
};
