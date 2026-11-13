import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from './theme';
import { radii, spacing } from './tokens';

export interface CardProps {
  children: ReactNode;
  tone?: 'surface' | 'soft' | 'accent' | 'sand' | 'danger';
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, tone = 'surface', onPress, accessibilityLabel, accessibilityHint, style }: CardProps) {
  const { colors } = useTheme();
  const bg = {
    surface: colors.surface,
    soft: colors.primarySoft,
    accent: colors.accentSoft,
    sand: colors.sand,
    danger: colors.dangerSoft,
  }[tone];
  const cardStyle = [styles.card, { backgroundColor: bg, borderColor: colors.border }, style];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && { opacity: 0.9 }]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.md + 4,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
});
