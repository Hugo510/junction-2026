import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Screen, spacing } from '../ui';

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
      <AppText variant="caption" tone="muted">
        {t('onboarding.step', { current: step, total: ONBOARDING_STEPS })}
      </AppText>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="display">{title}</AppText>
        {subtitle ? <AppText tone="muted">{subtitle}</AppText> : null}
      </View>
      {children}
    </Screen>
  );
}
