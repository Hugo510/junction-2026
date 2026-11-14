import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { haptics } from '../services/haptics';
import { AppText } from './AppText';
import { useTheme } from './theme';
import { MIN_TOUCH, radii, spacing } from './tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'lg' | 'md';
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  /** Light haptic on press (respects the vibration setting). */
  haptic?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  disabled,
  loading,
  accessibilityLabel,
  accessibilityHint,
  style,
  haptic = variant === 'primary',
}: ButtonProps) {
  const { colors } = useTheme();
  // Primary = the glowing ember (dark text on top: 6.9:1). One per screen.
  const palette = {
    primary: { bg: colors.cta, fg: 'onCta' as const, spinner: colors.onCta },
    accent: { bg: colors.accent, fg: 'onAccent' as const, spinner: colors.onAccent },
    secondary: { bg: colors.primarySoft, fg: 'primary' as const, spinner: colors.primary },
    ghost: { bg: 'transparent', fg: 'primary' as const, spinner: colors.primary },
    danger: { bg: colors.danger, fg: 'onDanger' as const, spinner: colors.onDanger },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={disabled || loading}
      onPress={() => {
        if (haptic) haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: size === 'lg' ? 56 : MIN_TOUCH,
          backgroundColor: palette.bg,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.spinner} />
      ) : (
        <View style={styles.row}>
          {icon}
          <AppText variant="label" tone={palette.fg} align="center" style={size === 'lg' ? styles.lgText : undefined}>
            {title}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lgText: { fontSize: 17 },
});
