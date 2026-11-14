import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from './AppText';
import { Button } from './Button';
import { useTheme } from './theme';
import { spacing } from './tokens';

export function EmptyState({ title, body, illustration, action }: { title: string; body?: string; illustration?: ReactNode; action?: ReactNode }) {
  return (
    <View style={styles.box}>
      {illustration}
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      {body ? (
        <AppText tone="muted" align="center">
          {body}
        </AppText>
      ) : null}
      {action}
    </View>
  );
}

export function LoadingState({ label }: { label?: string }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={[styles.box, styles.fill]} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={colors.primary} accessibilityLabel={label ?? t('common.loading')} />
      <AppText tone="muted">{label ?? t('common.loading')}</AppText>
    </View>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.box, styles.fill]} accessibilityLiveRegion="polite">
      <AppText variant="heading" align="center">
        {t('common.errorTitle')}
      </AppText>
      <AppText tone="muted" align="center">
        {t('common.errorBody')}
      </AppText>
      {onRetry ? <Button title={t('common.retry')} onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  fill: { flex: 1 },
});
