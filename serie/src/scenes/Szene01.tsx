import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Book, RIGHT_PAGE, WoodTable} from '../components/Book';
import {Butterfly} from '../components/Butterfly';
import {Sparkle} from '../components/DoodleFX';
import {DreamStars} from '../components/DreamStars';
import {useScene} from '../components/Scene';
import {Karima, KARIMA_HEAD, blinkAt} from '../components/Karima';
import {OrnateTitle} from '../components/OrnateTitle';
import {GROUND_Y, Town} from '../components/Town';
import {Rose, Vine} from '../components/Vines';
import {lerp, progress} from '../lib/anim';

const BOOK_Y = 420; // Buch (1080er-Koordinaten) vertikal mittig im Hochformat
const K_SCALE = 1.12;

/**
 * Folge 1 — Märchenbuch klappt auf, "Once upon a time …" schreibt sich; Karima hüpft mit
 * Koffer in eine Kritzelstadt und legt verschwörerisch den Finger an die Lippen.
 */
export const Szene01: React.FC = () => {
  const {frame, cue} = useScene();
  const cOnce = cue('Once');
  const cTime = cue('time', 0, 'end');
  const cGirl = cue('girl');
  const cKarima = cue('Karima');
  const cDreams = cue('dreams');
  const cMoved = cue('moved');
  const cSecret = cue('secret');
  const cBut = cue('But');

  // --- Buch ---
  const open = progress(frame, 0, 26, Easing.out(Easing.back(1.1)));
  const write = progress(frame, cOnce - 2, cTime + 6, Easing.inOut(Easing.sin));
  const flourish = progress(frame, cTime, cTime + 14);
  const vines = progress(frame, 8, cGirl, Easing.out(Easing.quad));
  const zoomStart = cGirl - 10;
  const zoom = progress(frame, zoomStart, zoomStart + 22, Easing.in(Easing.cubic));
  const target = {x: RIGHT_PAGE.x + RIGHT_PAGE.w * 0.5, y: RIGHT_PAGE.y + RIGHT_PAGE.h * 0.7 + BOOK_Y};
  const worldIn = progress(frame, zoomStart + 10, zoomStart + 22);

  // --- Welt ---
  const hopIn = progress(frame, cKarima - 10, cDreams + 6, Easing.out(Easing.quad));
  const kx = lerp(-200, 540, hopIn);
  const hopping = frame >= cKarima - 10 && frame < cDreams + 2;
  const secret = frame >= cBut;
  const cityOn = frame >= cMoved;
  const camPush = progress(frame, cBut, cSecret + 8, Easing.inOut(Easing.cubic));
  const headY = GROUND_Y + KARIMA_HEAD.y * K_SCALE;
  const camScale = lerp(1, 1.6, camPush);
  const dreamsIn = progress(frame, cDreams - 6, cDreams + 16);
  const dreamsOut = 1 - progress(frame, cMoved + 10, cMoved + 30);

  const {x, y, w, h} = RIGHT_PAGE;
  return (
    <AbsoluteFill>
      {worldIn < 1 ? (
        <AbsoluteFill
          style={{
            transform: `translate(${(540 - target.x) * zoom}px,${(960 - target.y) * zoom}px) scale(${interpolate(zoom, [0, 1], [1, 5])})`,
            transformOrigin: `${target.x}px ${target.y}px`,
          }}
        >
          <svg width={1080} height={1920}>
            <WoodTable />
            <g transform={`translate(0,${BOOK_Y})`}>
              <Book
                open={open}
                leftPage={
                  <g>
                    <Rose x={x - w / 2} y={y + h * 0.42} size={2.2} bloom={vines} salt="t1-lp-rose" />
                    <Vine points={[[x - w + 60, y + h - 60], [x - w + 120, y + h * 0.6], [x - w + 90, y + h * 0.3], [x - w + 170, y + 80]]} grow={vines} id="t1-lp-v" leaves={6} />
                    <Butterfly x={x - w / 2 + 70} y={y + 140} size={0.9} rotation={-12} id="t1-lp-b" />
                  </g>
                }
              >
                <OrnateTitle
                  lines={[
                    {text: 'Once upon', x: x + w / 2, y: y + 150, size: 92, center: true},
                    {text: 'a time …', x: x + w / 2, y: y + 262, size: 92, center: true},
                  ]}
                  write={write}
                  flourish={flourish}
                  id="t1-title"
                />
                <Vine points={[[x + 26, y + h - 20], [x + 44, y + h * 0.8], [x + 22, y + h * 0.62], [x + 46, y + h * 0.45], [x + 24, y + h * 0.3]]} grow={vines} id="t1-rp-v1" leaves={7} />
                <Vine points={[[x + w - 20, y + h - 26], [x + w * 0.75, y + h - 44], [x + w * 0.55, y + h - 22], [x + w * 0.35, y + h - 44]]} grow={vines} id="t1-rp-v2" leaves={5} />
              </Book>
            </g>
          </svg>
        </AbsoluteFill>
      ) : null}
      {worldIn > 0 ? (
        <AbsoluteFill
          style={{
            opacity: worldIn,
            transform: `scale(${lerp(0.8, 1, worldIn) * camScale})`,
            transformOrigin: `540px ${headY + 40}px`,
          }}
        >
          <svg width={1080} height={1920}>
            <Town drawFrom={zoomStart + 12} housesFrom={cMoved - 2} castle sky id="t1-town" />
            {/* Boden-Linie, damit die Seite nicht leer ist, bevor die Stadt kommt */}
            <path d={`M-20,${GROUND_Y + 6} Q540,${GROUND_Y - 10} 1100,${GROUND_Y + 4}`} stroke="#2A1C14" strokeWidth={2.6} fill="none" />
            <g transform={`translate(${kx},${GROUND_Y}) scale(${K_SCALE})`}>
              <Karima
                pose={secret ? 'shush' : hopping ? 'hop' : cityOn ? 'wonder' : 'stand'}
                expression={frame >= cSecret ? 'wink' : secret ? 'flirt' : cityOn ? 'wonder' : 'happy'}
                blush={secret ? progress(frame, cBut, cSecret + 6) * 0.9 : 0}
                walkCycle={(frame - cKarima) / 16}
                withSuitcase={!secret}
                lookX={secret ? 0 : cityOn ? Math.sin((frame - cMoved) * 0.09) * 0.9 : 0.6}
                lookY={secret ? 0.1 : cityOn ? -0.4 : 0}
                headTilt={secret ? -6 : 0}
                blink={blinkAt(frame, [cDreams + 18, cMoved + 34], 7)}
                capeWind={hopping ? 10 : 0}
              />
            </g>
            {secret ? (
              <g>
                <Sparkle x={kx + 70} y={headY + 20} size={40 * progress(frame, cBut + 4, cBut + 14)} rotation={frame * 5} salt="t1-psst" />
              </g>
            ) : null}
            {dreamsIn * dreamsOut > 0 ? (
              <g opacity={dreamsOut}>
                <DreamStars cx={kx} cy={headY - 40} radius={230} appear={dreamsIn} count={8} size={2.4} id="t1-dreams" />
              </g>
            ) : null}
          </svg>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
