import Svg, { G, Path } from 'react-native-svg';

import { LOGO_ARC_WIDTH, LOGO_ARCS, LOGO_SHIELD, LOGO_TRANSFORM, LOGO_VIEWBOX } from '@/brand/logo';

export function Logo({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox={LOGO_VIEWBOX} accessibilityLabel="Cyclemax" accessibilityRole="image">
      <G transform={LOGO_TRANSFORM}>
        <Path
          d={LOGO_SHIELD.d}
          fill="#FFFFFF"
          stroke={LOGO_SHIELD.stroke}
          strokeWidth={LOGO_SHIELD.strokeWidth}
          strokeLinejoin="round"
        />
        {LOGO_ARCS.map((arc) => (
          <Path key={arc.d} d={arc.d} fill="none" stroke={arc.stroke} strokeWidth={LOGO_ARC_WIDTH} />
        ))}
      </G>
    </Svg>
  );
}
