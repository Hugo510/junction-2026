import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '../services/haptics';
import { AppText } from './AppText';
import { useTheme } from './theme';
import { MIN_TOUCH, radii, spacing } from './tokens';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: ReactNode;
  accessibilityLabel?: string;
  /** "radio" for single choice groups, "checkbox" for multi, "button" otherwise. */
  role?: 'radio' | 'checkbox' | 'button';
}

export function Chip({ label, selected = false, onPress, icon, accessibilityLabel, role = 'radio' }: ChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={role === 'button' ? undefined : { selected, checked: selected }}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.row}>
        {icon}
        <AppText variant="label" tone={selected ? 'onPrimary' : 'default'}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

export function ChipGroup({ children }: { children: ReactNode }) {
  return (
    <View accessibilityRole="radiogroup" style={styles.group}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  group: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
