import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, radii, Screen, spacing, useTheme } from '../ui';

export const ONBOARDING_STEPS = 6;

export interface OnboardingFrameProps {
  step: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  loading?: boolean;
  showBack?: boolean;
}

export function OnboardingFrame({
  step,
  title,
  subtitle,
  children,
  onContinue,
  continueLabel,
  continueDisabled,
  loading,
  showBack = true,
}: OnboardingFrameProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        onContinue ? (
          <View style={{ gap: spacing.sm }}>
            <Button title={continueLabel ?? t('common.continue')} onPress={onContinue} disabled={continueDisabled} loading={loading} />
            {showBack && router.canGoBack() ? <Button title={t('common.back')} variant="ghost" onPress={() => router.back()} /> : null}
          </View>
        ) : undefined
      }
    >
      {/* Progress as glowing segments; read as "Step 2 of 6". */}
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t('onboarding.step', { current: step, total: ONBOARDING_STEPS })}
        accessibilityValue={{ min: 0, max: ONBOARDING_STEPS, now: step }}
        style={styles.steps}
      >
        {Array.from({ length: ONBOARDING_STEPS }, (_, i) => (
          <View key={i} style={[styles.step, { backgroundColor: i < step ? colors.cta : colors.border }]} />
        ))}
      </View>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="display">{title}</AppText>
        {subtitle ? <AppText tone="muted">{subtitle}</AppText> : null}
      </View>
      {children}
    </Screen>
  );
}

const styles = StyleSheet.create({
  steps: { flexDirection: 'row', gap: spacing.xs + 2, paddingVertical: spacing.xs },
  step: { flex: 1, height: 6, borderRadius: radii.pill },
});
