import React from 'react';
import {palette} from '../../theme';
import {Rough} from '../rough/Rough';

export const BOOK = {
  spineX: 540,
  top: 270,
  bottom: 850,
  pageW: 400,
};

/** Rechte Buchseite (Ziel der Kamerafahrt). */
export const RIGHT_PAGE = {
  x: BOOK.spineX,
  y: BOOK.top,
  w: BOOK.pageW,
  h: BOOK.bottom - BOOK.top,
};

/**
 * Altes Märchenbuch auf dem Tisch. `open` 0..1 klappt den Deckel um den Buchrücken
 * (2D-Cartoon-Perspektive: scaleX + leichtes Skew). Kinder werden auf der rechten
 * Seite gezeichnet (Seiteninhalt).
 */
export const Book: React.FC<{open: number; children?: React.ReactNode; leftPage?: React.ReactNode}> = ({
  open,
  children,
  leftPage,
}) => {
  const {spineX, top, bottom, pageW} = BOOK;
  const h = bottom - top;
  // Geschlossenes Buch zentriert, beim Öffnen rutscht es nach links
  const shift = (1 - open) * -pageW * 0.5;
  const angle = open * Math.PI; // 0 = zu, PI = ganz offen
  const sx = Math.cos(angle);
  const lift = Math.sin(angle);
  const coverFront = sx > 0;

  const page = (x: number, salt: string) => (
    <Rough
      shape={{kind: 'rect', x, y: top + 6, w: pageW - 8, h: h - 12}}
      salt={salt}
      fill="#F2E3C0"
      fillStyle="solid"
      strokeWidth={2.2}
      roughness={1}
    />
  );

  return (
    <g transform={`translate(${shift},0)`}>
      {/* Schatten auf dem Tisch */}
      <ellipse
        cx={spineX + (open > 0.5 ? 0 : pageW / 2)}
        cy={bottom + 18}
        rx={open > 0.5 ? pageW * 1.05 : pageW * 0.6}
        ry={22}
        fill="#000"
        opacity={0.28}
      />
      {/* Rückdeckel (unter den Seiten), rechts */}
      <Rough
        shape={{kind: 'rect', x: spineX - 4, y: top - 10, w: pageW + 18, h: h + 20}}
        salt="book-back"
        fill={palette.rosenrot}
        wash={palette.rosenrot}
        washOpacity={0.75}
        hachureGap={5}
        strokeWidth={3}
      />
      {/* Linke Hälfte: aufgeklappter Deckel innen + linke Seite */}
      {open > 0.5 ? (
        <g>
          <Rough
            shape={{kind: 'rect', x: spineX - pageW - 14, y: top - 10, w: pageW + 18, h: h + 20}}
            salt="book-inner-cover"
            fill={palette.rosenrot}
            wash={palette.rosenrot}
            washOpacity={0.75}
            hachureGap={5}
            strokeWidth={3}
          />
          {page(spineX - pageW + 2, 'book-page-left')}
          <g>{leftPage}</g>
        </g>
      ) : null}
      {/* Rechte Seite (Buchblock) */}
      {page(spineX + 6, 'book-page-right')}
      {/* Seitenkanten-Striche */}
      <Rough
        shape={{kind: 'path', d: `M${spineX + pageW + 2},${top + 14} L${spineX + pageW + 2},${bottom - 14} M${spineX + pageW + 6},${top + 20} L${spineX + pageW + 6},${bottom - 20}`}}
        salt="book-edges"
        strokeWidth={1.4}
      />
      <g>{open > 0.35 ? children : null}</g>
      {/* Buchfalz */}
      <path d={`M${spineX},${top} L${spineX},${bottom}`} stroke={palette.ink} strokeWidth={3} opacity={0.5} />
      <rect x={spineX - 14} y={top} width={28} height={h} fill="url(#book-gutter)" opacity={open > 0.5 ? 0.5 : 0} />
      <defs>
        <linearGradient id="book-gutter" x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="0.5" stopColor="#3a2412" stopOpacity="0.5" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Vorderdeckel, klappt um den Rücken */}
      {open < 1 ? (
        <g transform={`translate(${spineX},0) skewY(${(coverFront ? -1 : 1) * lift * 8}) scale(${sx},1) translate(${-spineX},0)`}>
          {coverFront ? (
            <g>
              <Rough
                shape={{kind: 'rect', x: spineX - 4, y: top - 10, w: pageW + 18, h: h + 20}}
                salt="book-cover"
                fill={palette.rosenrot}
                wash={palette.rosenrot}
                washOpacity={0.85}
                hachureGap={4}
                strokeWidth={3.2}
              />
              {/* Goldrahmen + Ornament */}
              <Rough
                shape={{kind: 'rect', x: spineX + 30, y: top + 24, w: pageW - 50, h: h - 48}}
                salt="book-frame"
                stroke={palette.senf}
                strokeWidth={3}
              />
              <Rough
                shape={{kind: 'ellipse', cx: spineX + pageW / 2 + 5, cy: top + h * 0.42, w: 190, h: 230}}
                salt="book-medallion"
                stroke={palette.senf}
                fill={palette.senf}
                hachureGap={7}
                fillWeight={1.2}
                strokeWidth={3}
              />
              <Rough
                shape={{kind: 'path', d: `M${spineX + 110},${top + h * 0.8} C${spineX + 160},${top + h * 0.72} ${spineX + 250},${top + h * 0.88} ${spineX + 300},${top + h * 0.8}`}}
                salt="book-swash"
                stroke={palette.senf}
                strokeWidth={3}
              />
              {[
                [spineX + 60, top + 56],
                [spineX + pageW - 40, top + 56],
                [spineX + 60, bottom - 56],
                [spineX + pageW - 40, bottom - 56],
              ].map(([x, y], i) => (
                <Rough key={i} shape={{kind: 'circle', cx: x, cy: y, d: 18}} salt={`book-corner${i}`} stroke={palette.senf} strokeWidth={2.4} />
              ))}
            </g>
          ) : (
            <Rough
              shape={{kind: 'rect', x: spineX - 4, y: top - 10, w: pageW + 18, h: h + 20}}
              salt="book-cover-inside"
              fill={palette.rosenrot}
              wash={palette.rosenrot}
              washOpacity={0.6}
              hachureGap={5}
              strokeWidth={3.2}
            />
          )}
        </g>
      ) : null}
    </g>
  );
};

/** Holztisch mit Maserung (Planken + Kritzel-Maserung). */
export const WoodTable: React.FC = () => {
  const planks = [0, 1, 2, 3, 4, 5];
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1080} fill="#8C5E38" />
      {planks.map((i) => {
        const y = i * 180;
        return (
          <g key={i}>
            <Rough
              shape={{kind: 'rect', x: -20, y, w: 1120, h: 180}}
              salt={`plank${i}`}
              fill={i % 2 === 0 ? palette.woodDark : palette.wood}
              hachureGap={9}
              hachureAngle={86}
              fillWeight={1.6}
              strokeWidth={3}
              stroke="#2b190c"
              roughness={1.6}
            />
            {[0.3, 0.55, 0.8].map((t, j) => (
              <Rough
                key={j}
                shape={{
                  kind: 'curve',
                  points: [
                    [-10, y + 180 * t],
                    [260, y + 180 * t + (j - 1) * 8],
                    [520, y + 180 * t - 6],
                    [780, y + 180 * t + 10],
                    [1090, y + 180 * t],
                  ],
                }}
                salt={`grain${i}-${j}`}
                stroke="#3a2212"
                strokeWidth={1.4}
                roughness={2}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
};
