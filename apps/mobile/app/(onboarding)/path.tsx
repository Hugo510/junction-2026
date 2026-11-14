import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { CarePath } from '../../src/domain/entities';
import { OnboardingFrame } from '../../src/features/OnboardingFrame';
import { haptics } from '../../src/services/haptics';
import { useSettings } from '../../src/store/settings';
import { AppText, Icon, MIN_TOUCH, radii, spacing, useTheme } from '../../src/ui';

/** Only the first path is live in this version; the others show where Hiillos is going. */
const PATHS: { id: CarePath; live: boolean }[] = [
  { id: 'postTreatment', live: true },
  { id: 'inTreatment', live: false },
  { id: 'stoppedTreatment', live: false },
  { id: 'notInCare', live: false },
];

/** Step 3: "Where are you right now?" — the care path Hiillos adapts to. */
export default function PathStep() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const carePath = useSettings((s) => s.carePath);
  const setCarePath = useSettings((s) => s.setCarePath);
  const selected = carePath ?? 'postTreatment';

  return (
    <OnboardingFrame
      step={3}
      title={t('onboarding.path.title')}
      subtitle={t('onboarding.path.subtitle')}
      onContinue={() => {
        setCarePath(selected);
        router.push('/consent');
      }}
    >
      <View style={styles.list} accessibilityRole="radiogroup">
        {PATHS.map(({ id, live }) => {
          const isSelected = live && selected === id;
          return (
            <Pressable
              key={id}
              disabled={!live}
              accessibilityRole="radio"
              accessibilityLabel={live ? t(`onboarding.path.${id}`) : `${t(`onboarding.path.${id}`)}. ${t('onboarding.path.comingNext')}`}
              accessibilityState={{ selected: isSelected, checked: isSelected, disabled: !live }}
              onPress={() => {
                haptics.tap();
                setCarePath(id);
              }}
              style={[
                styles.option,
                {
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? colors.primarySoft : colors.surface,
                  opacity: live ? 1 : 0.6,
                },
              ]}
            >
              <View style={styles.text}>
                <AppText variant="label">{t(`onboarding.path.${id}`)}</AppText>
                {!live ? (
                  <AppText variant="caption" tone="muted">
                    {t('onboarding.path.comingNext')}
                  </AppText>
                ) : null}
              </View>
              {isSelected ? <Icon name="check" color={colors.primary} /> : null}
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
    minHeight: MIN_TOUCH + 16,
    borderRadius: radii.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: { flex: 1, gap: 2 },
});
