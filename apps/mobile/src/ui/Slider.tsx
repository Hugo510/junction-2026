import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { haptics } from '../services/haptics';
import { AppText } from './AppText';
import { useTheme } from './theme';
import { MIN_TOUCH, radii, spacing } from './tokens';

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** Labels shown under both ends. */
  minLabel?: string;
  maxLabel?: string;
  /** Spoken/visible text for the current value. */
  formatValue?: (value: number) => string;
}

/**
 * Discrete, accessible "slider": large tappable segments plus screen-reader
 * increment/decrement actions. Easier to use than a thin continuous track.
 */
export function Slider({ label, value, min, max, step = 1, onChange, minLabel, maxLabel, formatValue }: SliderProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const values: number[] = [];
  for (let v = min; v <= max + 1e-9; v += step) values.push(Math.round(v * 10) / 10);
  const text = formatValue ? formatValue(value) : String(value);

  const set = (v: number) => {
    const clamped = Math.max(min, Math.min(max, Math.round(v * 10) / 10));
    if (clamped !== value) {
      haptics.tap();
      onChange(clamped);
    }
  };

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text }}
      accessibilityActions={[
        { name: 'increment', label: t('a11y.increase') },
        { name: 'decrement', label: t('a11y.decrease') },
      ]}
      onAccessibilityAction={(e) => set(e.nativeEvent.actionName === 'increment' ? value + step : value - step)}
      style={styles.wrap}
    >
      <AppText variant="heading" align="center">
        {text}
      </AppText>
      <View style={styles.track}>
        {values.map((v) => {
          const active = v <= value;
          return (
            <Pressable
              key={v}
              aria-hidden
              onPress={() => set(v)}
              hitSlop={4}
              style={[
                styles.segment,
                { backgroundColor: active ? colors.primary : colors.surfaceAlt, borderColor: colors.border },
              ]}
            />
          );
        })}
      </View>
      {(minLabel || maxLabel) && (
        <View style={styles.ends}>
          <AppText variant="caption" tone="muted">
            {minLabel}
          </AppText>
          <AppText variant="caption" tone="muted">
            {maxLabel}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  track: { flexDirection: 'row', gap: spacing.xs },
  segment: { flex: 1, minHeight: MIN_TOUCH, borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth },
  ends: { flexDirection: 'row', justifyContent: 'space-between' },
});
