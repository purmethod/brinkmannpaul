import React from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {progress} from '../lib/anim';
import {FPS, palette} from '../theme';
import {Butterfly} from './Butterfly';
import {Iris} from './Iris';
import {OrnateTitle} from './OrnateTitle';

const CENTER = {x: 540, y: 760};

/**
 * Outro (letzte 1,5 s): Schmetterling flattert ins Bild, die Iris schließt sich auf ihn,
 * "To be continued …" schreibt sich, darunter der Folgen-Hinweis.
 */
export const Outro: React.FC<{start: number; nextLine: string}> = ({start, nextLine}) => {
  const frame = useCurrentFrame();
  const f = frame - start;
  if (f < -12) return null;
  const fly = progress(f, -12, 10, Easing.out(Easing.cubic));
  const bx = 1180 + (CENTER.x - 1180) * fly + Math.sin(frame * 0.2) * 10;
  const by = 300 + (CENTER.y - 300) * fly + Math.cos(frame * 0.17) * 14;
  const close = progress(f, 0, 14, Easing.inOut(Easing.cubic));
  const radius = 1300 + (250 - 1300) * close;
  const write = progress(f, 8, 32, Easing.inOut(Easing.sin));
  const sub = progress(f, 26, 40);
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <Butterfly x={bx} y={by} size={1.9} rotation={Math.sin(frame * 0.2) * 12} id="outro-bfly" />
      </svg>
      <Iris cx={CENTER.x} cy={CENTER.y} radius={radius} />
      {f >= 0 ? (
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <OrnateTitle lines={[{text: 'To be continued …', x: 540, y: 1210, size: 108, center: true}]} write={write} color={palette.paper} id="outro-title" />
          <text
            x={540}
            y={1330}
            textAnchor="middle"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontStyle="italic"
            fontSize={46}
            fill={palette.senf}
            opacity={sub}
          >
            {nextLine}
          </text>
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

export const OUTRO_FRAMES = Math.round(1.5 * FPS);
