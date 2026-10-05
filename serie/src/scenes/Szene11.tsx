import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {Heart, Sparkle} from '../components/DoodleFX';
import {useScene} from '../components/Scene';
import {Karima, blinkAt} from '../components/Karima';
import {Letter, StarRoseBook} from '../components/Props';
import {WoodTable} from '../components/Book';
import {lerp, progress} from '../lib/anim';

/** Folge 11 — Buch mit Stern und Rose, ein Brief gleitet heraus, ein Papierherz flattert hoch. */
export const Szene11: React.FC = () => {
  const {frame, cue} = useScene();
  const cPrince = cue('prince', 0, 'end');
  const cPages = cue('pages');
  const cLetter = cue('letter');
  const cHer = cue('her');

  // Buch fällt ab Frame 0 hüpfend auf den Tisch
  const drop = progress(frame, 0, 16, Easing.out(Easing.bounce));
  const wiggle = frame >= cPages - 4 && frame < cLetter ? Math.sin(frame * 1.2) * 4 : 0;
  const slide = progress(frame, cLetter - 6, cLetter + 14, Easing.out(Easing.cubic));
  const heart = progress(frame, cHer - 4, cHer + 50, (t) => t);
  const karimaIn = progress(frame, cPrince - 6, cPrince + 10, Easing.out(Easing.back(1.4)));

  return (
    <AbsoluteFill>
      <svg width={1080} height={1920}>
        <WoodTable />
        <ellipse cx={540} cy={1080} rx={300 * drop} ry={40} fill="#000" opacity={0.25} />
        {/* Brief gleitet nach oben aus dem Buch */}
        {slide > 0 ? <Letter x={540 + slide * 40} y={lerp(860, 520, slide)} size={1.5} rotation={lerp(0, 8, slide)} id="t11-letter" /> : null}
        <StarRoseBook x={540} y={lerp(300, 880, drop)} size={1.5} rotation={wiggle + (1 - drop) * 20} id="t11-book" />
        {[0, 1, 2, 3].map((i) => (
          <Sparkle key={i} x={540 + Math.cos(i * 1.7 + frame * 0.04) * 330} y={880 + Math.sin(i * 1.7 + frame * 0.04) * 280} size={30} rotation={frame * 4} salt={`t11-sp${i}`} />
        ))}
        {heart > 0 ? (
          <g opacity={1 - Math.max(0, heart - 0.8) * 5}>
            <Heart x={580 + Math.sin(heart * 10) * 80} y={lerp(460, 120, heart)} size={lerp(40, 110, Math.min(1, heart * 2))} rotation={Math.sin(heart * 12) * 25} salt="t11-heart" />
          </g>
        ) : null}
        {/* Karima schaut von unten ins Bild */}
        <g transform={`translate(560,${lerp(2500, 2160, karimaIn)}) scale(1.85)`}>
          <Karima pose="heart" blush={frame >= cHer ? 1 : 0.3} expression={frame >= cHer ? 'dreamy' : 'wonder'} lookX={0} lookY={-1} blink={blinkAt(frame, [cPages + 6], 7)} id="t11-karima" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
