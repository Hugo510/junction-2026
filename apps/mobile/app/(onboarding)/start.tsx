import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { SupportedLanguage } from '../../src/domain/entities';
import { OnboardingFrame } from '../../src/features/OnboardingFrame';
import { applyLanguage, SUPPORTED_LANGUAGES } from '../../src/i18n';
import { haptics } from '../../src/services/haptics';
import { useSettings } from '../../src/store/settings';
import { AppText, Icon, MIN_TOUCH, radii, spacing, useTheme } from '../../src/ui';

/** Step 1: language (device language is preselected; English if not supported). */
export default function LanguageStep() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const language = useSettings((s) => s.language);
  const setLanguage = useSettings((s) => s.setLanguage);

  const choose = (lang: SupportedLanguage) => {
    haptics.tap();
    setLanguage(lang);
    applyLanguage(lang);
  };

  return (
    <OnboardingFrame
      step={1}
      title={t('onboarding.language.title')}
      subtitle={t('onboarding.language.subtitle')}
      onContinue={() => router.push('/welcome')}
      showBack={false}
    >
      <View style={styles.list} accessibilityRole="radiogroup">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const selected = language === lang;
          return (
            <Pressable
              key={lang}
              accessibilityRole="radio"
              accessibilityLabel={t(`languages.${lang}`)}
              accessibilityState={{ selected, checked: selected }}
              onPress={() => choose(lang)}
              style={[
                styles.option,
                { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primarySoft : colors.surface },
              ]}
            >
              <AppText variant="heading" style={styles.flex}>
                {t(`languages.${lang}`)}
              </AppText>
              {selected ? <Icon name="check" color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  option: {
    minHeight: MIN_TOUCH + 12,
    borderRadius: radii.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex: { flex: 1 },
});
