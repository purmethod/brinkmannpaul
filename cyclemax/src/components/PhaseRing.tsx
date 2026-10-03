import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import type { CycleStatus } from '@/engine';
import { colors, phaseColors } from '@/theme';

const STROKE = 16;
/** Phases other than today's stay in full colour (red and pink must stay distinguishable), just thinner. */
const THIN = 6;
const GAP_DEG = 2.5;

function polar(c: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: c + r * Math.sin(rad), y: c - r * Math.cos(rad) };
}

/** Clockwise arc from `from`° to `to`° (0° = 12 o'clock). */
function arc(c: number, r: number, from: number, to: number): string {
  const a = polar(c, r, from);
  const b = polar(c, r, to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`;
}

/**
 * The cycle as a ring: four phase segments in cycle order, lengths proportional to their days,
 * the current phase in full colour, a marker for today. With hormonal contraception only the
 * period days are coloured.
 */
export function PhaseRing({
  status,
  size,
  accessibilityLabel,
  children,
}: {
  status: CycleStatus;
  size: number;
  accessibilityLabel: string;
  children?: ReactNode;
}) {
  const c = size / 2;
  const r = c - STROKE / 2 - 6;
  const perDay = 360 / status.cycleLength;
  const periodOnly = status.mode === 'periodOnly';
  const segments = periodOnly ? status.segments.slice(0, 1) : status.segments;
  const markerDay = Math.min(status.cycleDay, status.cycleLength);
  const marker = polar(c, r, status.isLate ? 360 - perDay / 4 : (markerDay - 0.5) * perDay);

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <Svg width={size} height={size}>
        {periodOnly && <Circle cx={c} cy={c} r={r} stroke={colors.ringTrack} strokeWidth={STROKE} fill="none" />}
        {segments.map((s) => {
          const from = (s.startDay - 1) * perDay + (periodOnly ? 0 : GAP_DEG / 2);
          const to = s.endDay * perDay - (periodOnly ? 0 : GAP_DEG / 2);
          const current = !status.isLate ? s.phase === status.phase : s.phase === 'brandung';
          return (
            <Path
              key={s.phase}
              d={arc(c, r, from, to)}
              stroke={phaseColors[s.phase]}
              strokeWidth={current || periodOnly ? STROKE : THIN}
              fill="none"
            />
          );
        })}
        <Circle
          cx={marker.x}
          cy={marker.y}
          r={STROKE / 2 + 4}
          fill={colors.text}
          stroke={colors.background}
          strokeWidth={3}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', padding: STROKE * 2 },
});
