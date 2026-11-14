import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { useTheme } from './theme';
import { MIN_TOUCH, radii, spacing } from './tokens';

/**
 * Always-available access to the crisis screen.
 * - "icon" (headers): calm, neutral life-ring button — discoverable without constant alarm red.
 * - "full" (menu, chat hero): labelled pill.
 * Red is reserved for the crisis screen itself.
 */
export function HelpButton({ variant = 'icon' }: { variant?: 'icon' | 'full' }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const open = () => router.push('/crisis');

  if (variant === 'icon') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.needHelp')}
        accessibilityHint={t('a11y.helpHint')}
        onPress={open}
        style={({ pressed }) => [styles.icon, { backgroundColor: pressed ? colors.surfaceAlt : 'transparent' }]}
      >
        <Icon name="help" color={colors.accent} />
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.needHelp')}
      accessibilityHint={t('a11y.helpHint')}
      onPress={open}
      style={({ pressed }) => [styles.pill, { backgroundColor: colors.accentSoft, opacity: pressed ? 0.85 : 1 }]}
    >
      <Icon name="help" color={colors.accent} size={18} />
      <AppText variant="label" tone="accent">
        {t('common.needHelp')}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  icon: { width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: MIN_TOUCH / 2, alignItems: 'center', justifyContent: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: MIN_TOUCH,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
});
