import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { useTheme } from './theme';
import { radii, spacing } from './tokens';

/** Discreet but always-visible access to the crisis screen. */
export function HelpButton({ compact = false }: { compact?: boolean }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.needHelp')}
      accessibilityHint={t('a11y.helpHint')}
      hitSlop={10}
      onPress={() => router.push('/crisis')}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: colors.dangerSoft, borderColor: colors.danger, opacity: pressed ? 0.8 : 1 },
        compact && styles.compact,
      ]}
    >
      <Icon name="help" color={colors.danger} size={18} />
      <AppText variant="caption" tone="danger" style={styles.text}>
        {t('common.needHelp')}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 40,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  compact: { paddingHorizontal: spacing.sm + 2, marginRight: spacing.sm },
  text: { fontWeight: '600' },
});
