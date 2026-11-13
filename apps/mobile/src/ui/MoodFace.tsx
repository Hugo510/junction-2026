import Svg, { Circle, Path } from 'react-native-svg';

import type { Scale5 } from '../domain/entities';

const FILL: Record<Scale5, string> = {
  1: '#C9C6E8',
  2: '#D6D9EE',
  3: '#E6E1D3',
  4: '#CFE3D4',
  5: '#B5D8BF',
};
const CURVE: Record<Scale5, number> = { 1: -11, 2: -5, 3: 0, 4: 7, 5: 13 };

/** Friendly illustrated face for mood levels 1–5 (decorative; the control carries the label). */
export function MoodFace({ level, size = 56 }: { level: Scale5; size?: number }) {
  const ink = '#2B2B2B';
  const c = CURVE[level];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Circle cx={50} cy={50} r={46} fill={FILL[level]} />
      <Circle cx={36} cy={42} r={5} fill={ink} />
      <Circle cx={64} cy={42} r={5} fill={ink} />
      {level === 1 && <Path d="M 28 32 L 40 29 M 72 32 L 60 29" stroke={ink} strokeWidth={3} strokeLinecap="round" />}
      <Path d={`M 32 ${66 - c / 2} Q 50 ${66 + c} 68 ${66 - c / 2}`} stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />
    </Svg>
  );
}
