import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { FeedbackRating, InterventionId } from '../domain/entities';
import { haptics } from '../services/haptics';
import { useData } from '../store/data';
import { AppText, MIN_TOUCH, radii, spacing, useTheme } from '../ui';

const OPTIONS: { rating: FeedbackRating; emoji: string; key: string }[] = [
  { rating: 1, emoji: '👍', key: 'comfort.helped' },
  { rating: 0, emoji: '😐', key: 'comfort.neutral' },
  { rating: -1, emoji: '👎', key: 'comfort.notHelped' },
];

/** "Did this help?" — feeds the intervention picker. Also marks the item done in today's plan. */
export function FeedbackBar({ id }: { id: InterventionId }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const addFeedback = useData((s) => s.addFeedback);
  const plan = useData((s) => s.plan);
  const setPlanStatus = useData((s) => s.setPlanStatus);
  const [given, setGiven] = useState<FeedbackRating | null>(null);

  const give = async (rating: FeedbackRating) => {
    setGiven(rating);
    haptics.confirm();
    await addFeedback(id, rating);
    if (plan?.items.some((i) => i.interventionId === id && i.status === 'pending')) await setPlanStatus(id, 'done');
  };

  return (
    <View style={styles.wrap}>
      <AppText variant="label">{t('comfort.feedbackQuestion')}</AppText>
      <View style={styles.row} accessibilityRole="radiogroup">
        {OPTIONS.map((o) => {
          const selected = given === o.rating;
          return (
            <Pressable
              key={o.rating}
              accessibilityRole="radio"
              accessibilityLabel={t(o.key)}
              accessibilityState={{ selected, disabled: given !== null && !selected }}
              disabled={given !== null}
              onPress={() => give(o.rating)}
              style={[
                styles.option,
                { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primarySoft : colors.surface },
              ]}
            >
              <AppText variant="heading">{o.emoji}</AppText>
              <AppText variant="caption">{t(o.key)}</AppText>
            </Pressable>
          );
        })}
      </View>
      {given !== null ? (
        <AppText variant="caption" tone="muted" accessibilityLiveRegion="polite">
          {t('comfort.thanks')}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  option: {
    flex: 1,
    minHeight: MIN_TOUCH + 16,
    borderRadius: radii.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
});
