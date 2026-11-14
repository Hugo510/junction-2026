import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { InterventionId } from '../src/domain/entities';
import { availableInterventionIds, INTERVENTIONS } from '../src/domain/interventions';
import { FeedbackBar } from '../src/features/FeedbackBar';
import { interventionRoute } from '../src/features/routes';
import { useToday } from '../src/store/clock';
import { useData } from '../src/store/data';
import { AppText, Card, FeatureCard, Screen, spacing, type Category, type IllustrationName } from '../src/ui';

/** One colour and one illustration per exercise, so each is recognisable at a glance. */
const LOOK: Partial<Record<InterventionId, { category: Category; art: IllustrationName }>> = {
  breathing: { category: 'night', art: 'breath' },
  daylightWalk: { category: 'sun', art: 'walk' },
  move: { category: 'leaf', art: 'move' },
  fireplace: { category: 'ember', art: 'fireplace' },
  fish: { category: 'sky', art: 'lake' },
  seaSounds: { category: 'sky', art: 'waves' },
  puzzle: { category: 'rose', art: 'puzzle' },
};

/** Comfort library: guided exercises as hub cards; simple ideas as small cards with "Did this help?". */
export default function ComfortScreen() {
  const { t } = useTranslation();
  const sensors = useData((s) => s.sensors);
  const today = useToday();
  // Some ideas are offered only when they fit the person's own recent days.
  const available = availableInterventionIds({ sensors, today });
  const offered = INTERVENTIONS.filter((i) => available.includes(i.id));
  const guided = offered.filter((i) => interventionRoute(i.id));
  const ideas = offered.filter((i) => !interventionRoute(i.id));

  return (
    <Screen>
      <AppText tone="muted">{t('comfort.subtitle')}</AppText>
      <View style={{ gap: spacing.md }}>
        {guided.map((item) => {
          const route = interventionRoute(item.id);
          const look = LOOK[item.id] ?? { category: 'ember' as const, art: 'ember' as const };
          return (
            <FeatureCard
              key={item.id}
              eyebrow={t('common.minutes', { count: item.minutes })}
              title={t(`interventions.${item.id}.title`)}
              description={t(`interventions.${item.id}.why`)}
              category={look.category}
              art={look.art}
              onPress={() => route && router.push(route)}
            />
          );
        })}
      </View>

      <View style={{ gap: spacing.md }}>
        <AppText variant="heading">{t('comfort.ideas')}</AppText>
        {ideas.map((item) => (
          <Card key={item.id} tone="sand">
            <AppText variant="heading">{t(`interventions.${item.id}.title`)}</AppText>
            <AppText>{t(`interventions.${item.id}.howTo`)}</AppText>
            <FeedbackBar id={item.id} />
          </Card>
        ))}
      </View>
    </Screen>
  );
}
