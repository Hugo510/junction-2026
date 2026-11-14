import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OnboardingFrame } from '../../src/features/OnboardingFrame';
import { AppText, Avatar, Card, Icon, Illustration, radii, spacing, useTheme } from '../../src/ui';

/** Step 2: what the app does + clear "not a replacement for your care team" notice. */
export default function WelcomeStep() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <OnboardingFrame step={2} title={t('onboarding.welcome.title')} onContinue={() => router.push('/path')}>
      <View style={[styles.hero, { backgroundColor: colors.categories.ember.bg }]}>
        <View style={styles.art}>
          <Illustration name="ember" category="ember" size={132} />
          <View style={styles.companion}>
            <Avatar species="bird" size={64} animated />
          </View>
        </View>
        <AppText variant="title" align="center">
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

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.xs, borderRadius: radii.xl, paddingVertical: spacing.lg, paddingHorizontal: spacing.md },
  art: { width: 180, height: 136, alignItems: 'center', justifyContent: 'center' },
  companion: { position: 'absolute', right: 0, bottom: 0 },
});
