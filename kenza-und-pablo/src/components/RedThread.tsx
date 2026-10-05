import {getLength, getPointAtLength} from '@remotion/paths';
import {C, Ink, P, Sketch, clamp01, useBoil} from '../lib/sketch';
import {Sparkle} from './DoodleFX';

/** Der rote Faden: spinnt sich von `from` nach `to`, hängt durch (sag), kann glühen. */
export const RedThread: React.FC<{from: P; to: P; progress: number; sag?: number; glow?: number; seed?: number}> = ({
  from,
  to,
  progress,
  sag = 60,
  glow = 0,
  seed = 31,
}) => {
  const boil = useBoil(seed);
  const p = clamp01(progress);
  if (p <= 0) return null;
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const d = `M ${from[0]} ${from[1]} C ${from[0] + dx * 0.3} ${from[1] + dy * 0.3 + sag} ${from[0] + dx * 0.7} ${
    from[1] + dy * 0.7 + sag
  } ${to[0]} ${to[1]}`;
  const sk = new Sketch(boil);
  sk.path(d, {stroke: C.rot, strokeWidth: 3.2, roughness: 0.8, disableMultiStroke: true});
  const sk2 = new Sketch(boil + 5);
  sk2.path(d, {stroke: C.rot, strokeWidth: 1.6, roughness: 1.6, disableMultiStroke: true});
  // Schlaufen um die Hände
  const loops = new Sketch(boil + 9);
  loops.ellipse(from[0], from[1], 22, 12, {stroke: C.rot, strokeWidth: 2.4});
  const loopEnd = new Sketch(boil + 13);
  loopEnd.ellipse(to[0], to[1], 18, 11, {stroke: C.rot, strokeWidth: 2.4});
  const tip = getPointAtLength(d, p * getLength(d))!;
  return (
    <g>
      <defs>
        <filter id="thread-glow" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      {glow > 0 ? (
        <path d={d} stroke="#ff6b4a" strokeWidth={14} fill="none" filter="url(#thread-glow)" opacity={0.75 * glow} strokeLinecap="round" />
      ) : null}
      <Ink marks={loops.marks} progress={clamp01(p * 6)} />
      <Ink marks={sk.marks} progress={p} />
      <Ink marks={sk2.marks} progress={p} />
      {p >= 0.98 ? <Ink marks={loopEnd.marks} /> : null}
      {p < 1 ? <Sparkle x={tip.x} y={tip.y} size={13} color={C.rosa} seed={seed + 2} /> : null}
    </g>
  );
};
