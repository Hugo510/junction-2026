import { View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { useTheme } from './theme';

interface ChartProps {
  values: (number | null)[];
  color: string;
  height?: number;
  min?: number;
  max?: number;
  /** Spoken summary of the chart (charts are images for screen readers). */
  accessibilityLabel: string;
}

const VIEW_W = 300;

function scaleY(v: number, min: number, max: number, h: number, pad: number) {
  const range = max - min || 1;
  return pad + (1 - (v - min) / range) * (h - pad * 2);
}

/** Minimal line chart. Gaps (null) break the line. */
export function Sparkline({ values, color, height = 64, min, max, accessibilityLabel }: ChartProps) {
  const { colors } = useTheme();
  const nums = values.filter((v): v is number => v !== null);
  const lo = min ?? Math.min(...nums, 0);
  const hi = max ?? Math.max(...nums, 1);
  const step = values.length > 1 ? VIEW_W / (values.length - 1) : 0;
  const pad = 6;

  let d = '';
  let pen = false;
  values.forEach((v, i) => {
    if (v === null) {
      pen = false;
      return;
    }
    const x = i * step;
    const y = scaleY(v, lo, hi, height, pad);
    d += `${pen ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)} `;
    pen = true;
  });
  const lastIndex = values.map((v, i) => (v === null ? -1 : i)).reduce((a, b) => Math.max(a, b), -1);

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Svg width="100%" height={height} viewBox={`-6 0 ${VIEW_W + 12} ${height}`} preserveAspectRatio="none">
        <Line x1={0} x2={VIEW_W} y1={height - 1} y2={height - 1} stroke={colors.border} strokeWidth={1} />
        {d ? <Path d={d} stroke={color} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" /> : null}
        {lastIndex >= 0 && values[lastIndex] !== null ? (
          <Circle cx={lastIndex * step} cy={scaleY(values[lastIndex] as number, lo, hi, height, pad)} r={5} fill={color} />
        ) : null}
      </Svg>
    </View>
  );
}

/** Simple bar chart; null values show as a tiny placeholder. */
export function BarChart({ values, color, height = 80, max, accessibilityLabel }: ChartProps) {
  const { colors } = useTheme();
  const hi = max ?? Math.max(...values.map((v) => v ?? 0), 1);
  const n = Math.max(values.length, 1);
  const slot = VIEW_W / n;
  const barW = slot * 0.62;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Svg width="100%" height={height} viewBox={`0 0 ${VIEW_W} ${height}`} preserveAspectRatio="none">
        {values.map((v, i) => {
          const x = i * slot + (slot - barW) / 2;
          if (v === null) {
            return <Rect key={i} x={x} y={height - 3} width={barW} height={3} rx={1.5} fill={colors.border} />;
          }
          const h = Math.max(3, (v / hi) * (height - 4));
          return <Rect key={i} x={x} y={height - h} width={barW} height={h} rx={Math.min(5, barW / 2)} fill={color} />;
        })}
      </Svg>
    </View>
  );
}
