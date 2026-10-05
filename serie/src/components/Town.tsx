import React from 'react';
import {Easing, useCurrentFrame} from 'remotion';
import {progress} from '../lib/anim';
import {noise1} from '../lib/random';
import {palette} from '../theme';
import {Cloud} from './Cloud';
import {House, HouseProps} from './House';
import {Lantern} from './Lantern';
import {Rough} from './Rough';

export const GROUND_Y = 1560;

type HouseDef = Omit<HouseProps, 'draw' | 'face' | 'lean' | 'whisper' | 'lookX'> & {delay: number; leanTo: number};

/** Kritzelstadt im Hochformat: Kopfsteinpflaster, Fachwerk, Laternen, Schloss am Horizont. */
const HOUSES: HouseDef[] = [
  {id: 't-b1', x: 420, y: 1170, w: 120, h: 190, skew: -10, color: palette.rosa, roofColor: palette.salbei, delay: 0, leanTo: 4},
  {id: 't-b2', x: 650, y: 1165, w: 130, h: 220, skew: 14, color: palette.senf, roofColor: palette.rosenrot, delay: 4, leanTo: -4},
  {id: 't-m1', x: 250, y: 1340, w: 200, h: 330, skew: 22, color: palette.paperDark, roofColor: palette.senf, delay: 8, leanTo: 7},
  {id: 't-m2', x: 840, y: 1345, w: 210, h: 310, skew: -24, color: palette.salbei, roofColor: palette.rosenrot, delay: 12, leanTo: -7},
  {id: 't-f1', x: 70, y: 1640, w: 300, h: 600, skew: 40, color: palette.senf, roofColor: palette.rosenrot, delay: 16, leanTo: 9},
  {id: 't-f2', x: 1010, y: 1640, w: 300, h: 640, skew: -42, color: palette.rosa, roofColor: palette.salbei, delay: 20, leanTo: -9},
];

export const Town: React.FC<{
  /** Frame, ab dem sich die Stadt aufzeichnet (vorher unsichtbar). Negativ = schon fertig. */
  drawFrom?: number;
  /** 0..1 Häuser bekommen Gesichter. */
  faces?: number;
  /** 0..1 Häuser neigen sich zur Mitte. */
  lean?: number;
  castle?: boolean;
  sky?: boolean;
  /** Pflastergasse durch eine verknotete Kritzelschlinge ersetzen (0..1). */
  knot?: number;
  /** Häuser/Laternen erst ab diesem Frame (Default = drawFrom). */
  housesFrom?: number;
  id?: string;
}> = ({drawFrom = -100, faces = 0, lean = 0, castle = true, sky = true, knot = 0, housesFrom, id = 'town'}) => {
  const frame = useCurrentFrame();
  const d = (delay: number, len = 40) => progress(frame, drawFrom + delay, drawFrom + delay + len, Easing.out(Easing.quad));
  const hf = housesFrom ?? drawFrom;
  const dh = (delay: number, len = 40) => progress(frame, hf + delay, hf + delay + len, Easing.out(Easing.quad));
  return (
    <g>
      {sky ? (
        <g>
          <Cloud x={220} y={430} scale={1.3} drift={frame} draw={d(10)} id={`${id}-cl1`} />
          <Cloud x={820} y={330} scale={1} drift={frame * 0.7} draw={d(18)} id={`${id}-cl2`} />
          <Cloud x={600} y={560} scale={0.7} drift={frame * 1.2} draw={d(26)} id={`${id}-cl3`} />
        </g>
      ) : null}
      {castle ? (
        <g opacity={0.9}>
          {/* Schloss am Horizont */}
          <Rough
            shape={{kind: 'path', d: 'M470,1100 L470,960 L490,960 L490,940 L505,940 L505,960 L520,960 L520,900 L540,860 L560,900 L560,960 L575,960 L575,940 L590,940 L590,960 L610,960 L610,1100 Z'}}
            salt={`${id}-castle`}
            base={palette.paper}
            fill={palette.rosa}
            hachureGap={6}
            strokeWidth={2.2}
            draw={d(0, 50)}
          />
          <Rough shape={{kind: 'path', d: 'M540,860 L540,820 L566,830 L540,840'}} salt={`${id}-flag`} stroke={palette.rosenrot} strokeWidth={2.4} draw={d(30, 20)} />
        </g>
      ) : null}
      {/* Hügel + Boden */}
      <Rough
        shape={{kind: 'path', d: 'M-20,1140 C140,1060 300,1080 430,1130 C560,1070 700,1060 820,1120 C930,1070 1020,1080 1100,1130 L1100,1170 L-20,1170 Z'}}
        salt={`${id}-hills`}
        base={palette.paper}
        fill={palette.salbei}
        hachureGap={9}
        hachureAngle={-30}
        strokeWidth={2}
        stroke={palette.inkSoft}
        draw={d(0, 30)}
      />
      {knot <= 0.02 ? (
        <g>
          <Rough shape={{kind: 'curve', points: [[120, 1920], [300, 1650], [430, 1420], [500, 1250], [520, 1170]]}} salt={`${id}-edgeL`} strokeWidth={2.6} draw={d(4)} />
          <Rough shape={{kind: 'curve', points: [[960, 1920], [790, 1650], [660, 1420], [590, 1250], [560, 1170]]}} salt={`${id}-edgeR`} strokeWidth={2.6} draw={d(4)} />
          {Array.from({length: 7}).map((_, row) => {
            const t = row / 7;
            const y = 1880 - row * 100 * (1 - t * 0.5);
            const half = 380 * (1 - t * 0.8);
            const count = 6 - Math.floor(row / 2);
            return Array.from({length: count}).map((__, i) => (
              <Rough
                key={`${row}-${i}`}
                shape={{kind: 'ellipse', cx: 540 - half + ((i + 0.5 + (row % 2) * 0.3) / count) * half * 2, cy: y, w: (half / count) * 1.4, h: 22 * (1 - t * 0.6)}}
                salt={`${id}-st${row}-${i}`}
                stroke={palette.inkSoft}
                strokeWidth={1.6}
                draw={d(8 + row * 3, 20)}
              />
            ));
          })}
        </g>
      ) : (
        <Knot cx={540} cy={1480} r={260 + knot * 60} t={knot} id={`${id}-knot`} />
      )}
      {HOUSES.map((h, i) => (
        <House
          key={h.id}
          {...h}
          id={`${id}-${h.id}`}
          draw={dh(h.delay, 44)}
          face={faces}
          lean={h.leanTo * lean + (lean > 0 ? noise1(frame * 0.05, i) * 1.5 * lean : 0)}
          whisper={faces > 0.9 ? 1 : 0}
        />
      ))}
      <Lantern id={`${id}-lan1`} x={410} y={1420} h={300} bend={-22} draw={dh(30, 30)} />
      <Lantern id={`${id}-lan2`} x={680} y={1420} h={290} bend={22} draw={dh(36, 30)} />
    </g>
  );
};

/** Verknotete Gassen: eine Kritzelschlinge, die sich zum Knäuel zieht (t 0..1). */
export const Knot: React.FC<{cx: number; cy: number; r: number; t: number; id: string}> = ({cx, cy, r, t, id}) => {
  const frame = useCurrentFrame();
  const pts: [number, number][] = [];
  const loops = 6;
  const n = 90;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = u * Math.PI * 2 * loops + frame * 0.02;
    const rr = r * (0.35 + 0.65 * Math.abs(Math.sin(u * Math.PI * 3.3 + 0.7))) * (1 - 0.25 * t);
    pts.push([cx + Math.cos(a) * rr * 1.3, cy + Math.sin(a * 1.13) * rr * 0.55]);
  }
  return (
    <g>
      <Rough shape={{kind: 'curve', points: pts}} salt={id} strokeWidth={3} draw={Math.min(1, t * 1.4)} />
      {/* Pflastersteine, die durcheinanderpurzeln */}
      {Array.from({length: 10}).map((_, i) => {
        const a = i * 0.9 + frame * 0.05;
        return (
          <Rough
            key={i}
            shape={{kind: 'ellipse', cx: cx + Math.cos(a) * r * 1.1, cy: cy + Math.sin(a) * r * 0.45, w: 50, h: 22}}
            salt={`${id}-stone${i}`}
            stroke={palette.inkSoft}
            strokeWidth={1.6}
            opacity={t}
          />
        );
      })}
    </g>
  );
};
