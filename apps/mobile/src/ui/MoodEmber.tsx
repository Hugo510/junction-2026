import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import type { Scale5 } from '../domain/entities';

const FLAME = 'M50 0 C 70 40 100 70 92 110 C 86 142 66 160 50 160 C 34 160 14 142 8 110 C 0 70 30 40 50 0 Z';
const BASE_Y = 80;

/** Flame drawn from the 100 × 160 path, scaled to `height` and standing on the coals. */
function Flame({ height, color, opacity = 1 }: { height: number; color: string; opacity?: number }) {
  const s = height / 160;
  return (
    <G transform={`translate(${50 - 50 * s}, ${BASE_Y - 160 * s}) scale(${s})`} opacity={opacity}>
      <Path d={FLAME} fill={color} />
    </G>
  );
}

/**
 * Mood as an ember, level 1–5: a low glow up to a bright flame. Even level 1 is alight —
 * the embers never go out. Decorative: the control carries the label.
 */
export function MoodEmber({ level, size = 56 }: { level: Scale5; size?: number }) {
  const height = 16 + level * 12; // 28 … 76
  return (
    <View aria-hidden>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx={50} cy={64} r={20 + level * 5} fill="#F28C38" opacity={0.08 + level * 0.03} />
        <Ellipse cx={50} cy={84} rx={32} ry={9} fill="#6B4A33" />
        <Ellipse cx={50} cy={82} rx={12 + level * 3} ry={4.5} fill="#F2A65A" opacity={0.55 + level * 0.08} />
        <Flame height={height} color="#F28C38" opacity={0.9} />
        <Flame height={height * 0.58} color="#FFD27A" />
      </Svg>
    </View>
  );
}
