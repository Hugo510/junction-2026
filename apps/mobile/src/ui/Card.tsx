import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from './theme';
import { elevation, radii, spacing } from './tokens';

export interface CardProps {
  children: ReactNode;
  tone?: 'surface' | 'soft' | 'accent' | 'sand' | 'danger';
  /** "flat" = no shadow (for cards inside other surfaces, e.g. chat). */
  flat?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

/** Surface separated by tone and a soft shadow — no borders, less visual noise. */
export function Card({ children, tone = 'surface', flat = false, onPress, accessibilityLabel, accessibilityHint, style }: CardProps) {
  const { colors, scheme } = useTheme();
  const bg = {
    surface: colors.surface,
    soft: colors.primarySoft,
    accent: colors.accentSoft,
    sand: colors.sand,
    danger: colors.dangerSoft,
  }[tone];
  const shadow = flat || tone !== 'surface' || scheme === 'dark' ? elevation.none : elevation.low;
  const cardStyle = [styles.card, { backgroundColor: bg }, shadow, style];

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
    padding: spacing.md,
    gap: spacing.sm,
  },
});
