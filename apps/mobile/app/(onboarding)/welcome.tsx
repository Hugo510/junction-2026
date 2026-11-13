import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OnboardingFrame } from '../../src/features/OnboardingFrame';
import { AppText, Avatar, Card, Icon, spacing, useTheme } from '../../src/ui';

/** Step 2: what the app does + clear "not a replacement for your care team" notice. */
export default function WelcomeStep() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <OnboardingFrame step={2} title={t('onboarding.welcome.title')} onContinue={() => router.push('/consent')}>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <Avatar species="bird" size={120} animated />
        <AppText variant="heading" align="center">
          {t('common.appName')}
        </AppText>
        <AppText tone="muted" align="center">
          {t('common.tagline')}
        </AppText>
      </View>
      <AppText>{t('onboarding.welcome.body')}</AppText>
      <Card tone="accent">
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <Icon name="shield" color={colors.accent} />
          <AppText variant="label">{t('onboarding.welcome.disclaimerTitle')}</AppText>
        </View>
        <AppText>{t('onboarding.welcome.disclaimer')}</AppText>
      </Card>
    </OnboardingFrame>
  );
}
