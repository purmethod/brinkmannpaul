import React from 'react';
import {useCurrentFrame} from 'remotion';
import {palette} from '../theme';
import {Rough} from './Rough';

export type HouseProps = {
  /** Fußpunkt (Mitte der Grundlinie). */
  x: number;
  y: number;
  w: number;
  h: number;
  roofH?: number;
  /** Schiefe in px: Oberkante gegenüber Grundlinie verschoben. */
  skew?: number;
  color?: string;
  roofColor?: string;
  /** Lehnen in Grad (dreht um den Fußpunkt) — zum Flüstern zur Figur hin. */
  lean?: number;
  /** 0..1 Zeichnet sich auf. */
  draw?: number;
  /** 0..1 Gesicht erwacht (Fenster werden Augen, Tür wird Mund). */
  face?: number;
  /** Blickrichtung der Fenster-Augen (-1..1). */
  lookX?: number;
  /** 0..1 Mund flüstert (öffnet/schließt). */
  whisper?: number;
  chimney?: boolean;
  id: string;
};

/**
 * Schiefes Kritzel-Haus. Mit `face` bekommt es Augen (Fenster) und Mund (Tür),
 * mit `lean` neigt es sich wie ein Lebewesen.
 */
export const House: React.FC<HouseProps> = ({
  x,
  y,
  w,
  h,
  roofH = w * 0.55,
  skew = 0,
  color = palette.paperDark,
  roofColor = palette.rosenrot,
  lean = 0,
  draw = 1,
  face = 0,
  lookX = 0,
  whisper = 0,
  chimney = true,
  id,
}) => {
  const frame = useCurrentFrame();
  if (draw <= 0) return null;
  const s = (n: string) => `${id}-${n}`;
  const hw = w / 2;
  // Wände (leicht trapezförmig + schief)
  const bl: [number, number] = [-hw, 0];
  const br: [number, number] = [hw, 0];
  const tr: [number, number] = [hw * 0.92 + skew, -h];
  const tl: [number, number] = [-hw * 0.94 + skew, -h];
  const apex: [number, number] = [skew * 1.4 + w * 0.06, -h - roofH];

  // Punkt auf der rechten Dachschräge (t = 0 Spitze .. 1 Traufe)
  const lerpX = (t: number) => apex[0] + (tr[0] + 16 - apex[0]) * t;
  const slopeY = (t: number) => apex[1] + (tr[1] + 6 - apex[1]) * t;

  const wallDraw = Math.min(1, draw * 1.6);
  const roofDraw = Math.min(1, Math.max(0, draw * 1.6 - 0.35));
  const detailDraw = Math.min(1, Math.max(0, draw * 1.6 - 0.6));

  // Fenster-Augen
  const winW = w * 0.24;
  const winH = h * 0.2;
  const winY = -h * 0.66;
  const winX = [-w * 0.22 + skew * 0.66, w * 0.2 + skew * 0.66];
  const blink = face > 0 && Math.floor((frame + id.length * 13) % 75) < 4 ? 1 : 0;

  // Tür / Mund
  const doorW = w * 0.26;
  const doorH = h * 0.32;
  const doorX = skew * 0.15;
  const mouthOpen = whisper * (0.5 + 0.5 * Math.sin(frame * 0.6 + id.length));

  return (
    <g transform={`translate(${x},${y}) rotate(${lean})`}>
      <Rough
        shape={{kind: 'polygon', points: [bl, br, tr, tl]}}
        salt={s('wall')}
        base={palette.paper}
        fill={color}
        wash={color}
        washOpacity={0.55}
        hachureGap={8}
        hachureAngle={-60}
        fillWeight={1.4}
        strokeWidth={2.8}
        draw={wallDraw}
      />
      {/* Fachwerk-Kritzel */}
      <Rough
        shape={{kind: 'line', x1: -hw * 0.94 + skew * 0.5, y1: -h * 0.42, x2: hw * 0.95 + skew * 0.5, y2: -h * 0.44}}
        salt={s('beam')}
        strokeWidth={1.8}
        draw={detailDraw}
      />
      {chimney ? (
        <Rough
          shape={{
            kind: 'polygon',
            points: [
              [lerpX(0.42) - w * 0.06, slopeY(0.42) + 24],
              [lerpX(0.42) - w * 0.06, slopeY(0.42) - roofH * 0.42],
              [lerpX(0.42) + w * 0.07, slopeY(0.42) - roofH * 0.45],
              [lerpX(0.42) + w * 0.07, slopeY(0.42) + 30],
            ],
          }}
          salt={s('chimney')}
          fill={palette.inkSoft}
          hachureGap={4}
          strokeWidth={2.4}
          draw={roofDraw}
        />
      ) : null}
      {/* Dach */}
      <Rough
        shape={{kind: 'polygon', points: [[tl[0] - 16, tl[1] + 4], [tr[0] + 16, tr[1] + 6], apex]}}
        salt={s('roof')}
        base={palette.paper}
        fill={roofColor}
        wash={roofColor}
        washOpacity={0.4}
        hachureGap={5}
        hachureAngle={30}
        strokeWidth={2.8}
        draw={roofDraw}
      />
      {/* Dachziegel-Bögen */}
      {roofDraw > 0.6
        ? [0.35, 0.65].map((t, i) => {
            const yy = apex[1] + (tl[1] - apex[1]) * t;
            const half = (tr[0] - tl[0] + 32) * t * 0.45;
            const cx = apex[0] + (skew * 0.2) * t;
            return (
              <Rough
                key={i}
                shape={{kind: 'path', d: `M${cx - half},${yy} q${half / 2},10 ${half},0 q${half / 2},10 ${half},0`}}
                salt={s(`tile${i}`)}
                strokeWidth={1.6}
                draw={(roofDraw - 0.6) / 0.4}
              />
            );
          })
        : null}

      {/* Fenster bzw. Augen */}
      {winX.map((wx, i) => {
        const eyeOpen = face * (1 - blink);
        return (
          <g key={i}>
            <Rough
              shape={{kind: 'rect', x: wx - winW / 2, y: winY - winH / 2, w: winW, h: winH}}
              salt={s(`win${i}`)}
              fill={palette.senf}
              wash={palette.senf}
              washOpacity={0.5 * (1 - face * 0.6)}
              hachureGap={4}
              strokeWidth={2.4}
              draw={detailDraw}
            />
            {face > 0 ? (
              <g opacity={Math.min(1, face * 1.5)}>
                {/* Augapfel im Fenster */}
                <ellipse cx={wx} cy={winY} rx={winW * 0.42} ry={winH * 0.44 * Math.max(0.1, eyeOpen)} fill="#FBF6EA" stroke={palette.ink} strokeWidth={2.2} />
                {eyeOpen > 0.3 ? (
                  <ellipse cx={wx + lookX * winW * 0.2} cy={winY + 2} rx={winW * 0.15} ry={winH * 0.22 * eyeOpen} fill={palette.ink} />
                ) : null}
                {/* Augenlid (Fensterladen) */}
                <Rough
                  shape={{kind: 'path', d: `M${wx - winW * 0.5},${winY - winH * 0.5 - 6} Q${wx},${winY - winH * 0.5 - 18 - face * 6} ${wx + winW * 0.5},${winY - winH * 0.5 - 6}`}}
                  salt={s(`brow${i}`)}
                  strokeWidth={3}
                />
              </g>
            ) : (
              <Rough
                shape={{kind: 'path', d: `M${wx},${winY - winH / 2} L${wx},${winY + winH / 2} M${wx - winW / 2},${winY} L${wx + winW / 2},${winY}`}}
                salt={s(`cross${i}`)}
                strokeWidth={1.6}
                draw={detailDraw}
              />
            )}
          </g>
        );
      })}

      {/* Tür bzw. Mund */}
      {face > 0.5 ? (
        <g opacity={Math.min(1, (face - 0.5) * 2)}>
          <Rough
            shape={{kind: 'ellipse', cx: doorX, cy: -doorH * 0.45, w: doorW * 0.9, h: 10 + mouthOpen * doorH * 0.5}}
            salt={s('mouth')}
            fill={palette.ink}
            wash={palette.rosenrot}
            washOpacity={0.6}
            hachureGap={3}
            strokeWidth={2.6}
          />
        </g>
      ) : (
        <Rough
          shape={{kind: 'path', d: `M${doorX - doorW / 2},0 L${doorX - doorW / 2},${-doorH * 0.7} Q${doorX},${-doorH * 1.1} ${doorX + doorW / 2},${-doorH * 0.7} L${doorX + doorW / 2},0`}}
          salt={s('door')}
          fill={palette.salbei}
          wash={palette.salbei}
          washOpacity={0.45}
          hachureGap={4}
          strokeWidth={2.4}
          draw={detailDraw}
        />
      )}
    </g>
  );
};
