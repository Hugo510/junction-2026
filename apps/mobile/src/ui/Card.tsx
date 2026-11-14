import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from './theme';
import { elevation, radii, spacing, type Category } from './tokens';

export interface CardProps {
  children: ReactNode;
  tone?: 'surface' | 'soft' | 'accent' | 'sand' | 'danger';
  /** Area of the app. All areas share the same quiet card (kept for call sites and illustrations). */
  category?: Category;
  /** "flat" = no shadow (for cards inside other surfaces, e.g. chat). */
  flat?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * One card for the whole app: white surface, hairline border, a very soft shadow.
 * Tinted tones (soft / accent / sand / danger) are flat fills for notes and warnings.
 */
export function Card({ children, tone = 'surface', category, flat = false, onPress, accessibilityLabel, accessibilityHint, style }: CardProps) {
  const { colors, scheme } = useTheme();
  const plain = !!category || tone === 'surface';
  const bg = category
    ? colors.categories[category].bg
    : {
        surface: colors.surface,
        soft: colors.primarySoft,
        accent: colors.accentSoft,
        sand: colors.sand,
        danger: colors.dangerSoft,
      }[tone];
  const shadow = flat || !plain || scheme === 'dark' ? elevation.none : elevation.low;
  const cardStyle = [styles.card, { backgroundColor: bg, borderColor: plain ? colors.border : 'transparent' }, shadow, style];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
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
    borderWidth: StyleSheet.hairlineWidth * 2,
    padding: spacing.md + spacing.xs,
    gap: spacing.sm,
  },
});
