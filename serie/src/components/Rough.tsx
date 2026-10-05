import React, {useMemo} from 'react';
import rough from 'roughjs';
import type {Options} from 'roughjs/bin/core';
import {useBoilSeed} from '../lib/boil';
import {palette} from '../theme';

const generator = rough.generator();

export type RoughShape =
  | {kind: 'path'; d: string}
  | {kind: 'ellipse'; cx: number; cy: number; w: number; h: number}
  | {kind: 'circle'; cx: number; cy: number; d: number}
  | {kind: 'rect'; x: number; y: number; w: number; h: number}
  | {kind: 'line'; x1: number; y1: number; x2: number; y2: number}
  | {kind: 'polygon'; points: [number, number][]}
  | {kind: 'curve'; points: [number, number][]}
  | {kind: 'linearPath'; points: [number, number][]};

export type RoughProps = {
  shape: RoughShape;
  /** Eindeutiger Name — bestimmt den Seed (zusammen mit dem Frame). */
  salt: string;
  stroke?: string;
  strokeWidth?: number;
  /** Buntstift-Kolorit als Schraffur. */
  fill?: string;
  fillStyle?: Options['fillStyle'];
  hachureGap?: number;
  hachureAngle?: number;
  fillWeight?: number;
  roughness?: number;
  bowing?: number;
  /** 0..1: Linie zeichnet sich selbst (Feder-Effekt). */
  draw?: number;
  /** Schraffur separat einblenden (0..1). Default = draw. */
  fillDraw?: number;
  /** Doppelte Striche (Tusche-Look). */
  multiStroke?: boolean;
  opacity?: number;
  boilEvery?: number;
  /** Optional: Fläche unter der Schraffur (sehr dezent). */
  wash?: string;
  washOpacity?: number;
  /** Deckende Grundfläche (z. B. Papierfarbe), damit Dahinterliegendes nicht durchscheint. */
  base?: string;
};

const build = (shape: RoughShape, o: Options) => {
  switch (shape.kind) {
    case 'path':
      return generator.path(shape.d, o);
    case 'ellipse':
      return generator.ellipse(shape.cx, shape.cy, shape.w, shape.h, o);
    case 'circle':
      return generator.circle(shape.cx, shape.cy, shape.d, o);
    case 'rect':
      return generator.rectangle(shape.x, shape.y, shape.w, shape.h, o);
    case 'line':
      return generator.line(shape.x1, shape.y1, shape.x2, shape.y2, o);
    case 'polygon':
      return generator.polygon(shape.points, o);
    case 'curve':
      return generator.curve(shape.points, o);
    case 'linearPath':
      return generator.linearPath(shape.points, o);
  }
};

const washPath = (shape: RoughShape): string | null => {
  switch (shape.kind) {
    case 'path':
      return shape.d;
    case 'ellipse':
      return `M${shape.cx - shape.w / 2},${shape.cy} a${shape.w / 2},${shape.h / 2} 0 1,0 ${shape.w},0 a${shape.w / 2},${shape.h / 2} 0 1,0 ${-shape.w},0`;
    case 'circle':
      return `M${shape.cx - shape.d / 2},${shape.cy} a${shape.d / 2},${shape.d / 2} 0 1,0 ${shape.d},0 a${shape.d / 2},${shape.d / 2} 0 1,0 ${-shape.d},0`;
    case 'rect':
      return `M${shape.x},${shape.y} h${shape.w} v${shape.h} h${-shape.w} Z`;
    case 'polygon':
      return `M${shape.points.map((p) => p.join(',')).join(' L')} Z`;
    default:
      return null;
  }
};

/**
 * Wackelige Tuschelinie mit Buntstift-Schraffur. Wird alle paar Frames neu
 * "gezeichnet" (boiling), deterministisch aus Frame + salt.
 */
export const Rough: React.FC<RoughProps> = ({
  shape,
  salt,
  stroke = palette.ink,
  strokeWidth = 2.4,
  fill,
  fillStyle = 'hachure',
  hachureGap = 7,
  hachureAngle = -41,
  fillWeight = 1.6,
  roughness = 1.3,
  bowing = 1.2,
  draw = 1,
  fillDraw,
  multiStroke = true,
  opacity = 1,
  boilEvery,
  wash,
  washOpacity = 0.28,
  base,
}) => {
  const seed = useBoilSeed(salt, boilEvery);
  const key = JSON.stringify(shape);
  const paths = useMemo(() => {
    const drawable = build(shape, {
      seed,
      stroke,
      strokeWidth,
      fill,
      fillStyle,
      hachureGap,
      hachureAngle,
      fillWeight,
      roughness,
      bowing,
      disableMultiStroke: !multiStroke,
      disableMultiStrokeFill: true,
    });
    return generator.toPaths(drawable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, key, stroke, strokeWidth, fill, fillStyle, hachureGap, hachureAngle, fillWeight, roughness, bowing, multiStroke]);

  if (draw <= 0 && (fillDraw ?? draw) <= 0) return null;
  const fd = fillDraw ?? draw;
  const washD = wash || base ? washPath(shape) : null;

  return (
    <g opacity={opacity}>
      {washD && base && fd > 0 ? <path d={washD} fill={base} opacity={Math.min(1, fd * 1.5)} stroke="none" /> : null}
      {washD && wash && fd > 0 ? (
        <path d={washD} fill={wash} opacity={washOpacity * fd} stroke="none" />
      ) : null}
      {paths.map((p, i) => {
        const isFill = p.stroke === fill && p.stroke !== stroke;
        const amount = isFill ? fd : draw;
        if (amount <= 0) return null;
        const partial = amount < 1;
        return (
          <path
            key={i}
            d={p.d}
            stroke={p.stroke}
            strokeWidth={p.strokeWidth}
            fill={p.fill ?? 'none'}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={partial ? 1 : undefined}
            strokeDasharray={partial ? 1 : undefined}
            strokeDashoffset={partial ? 1 - amount : undefined}
          />
        );
      })}
    </g>
  );
};
