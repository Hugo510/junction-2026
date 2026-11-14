import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { INTERVENTIONS } from '../src/domain/interventions';
import { FeedbackBar } from '../src/features/FeedbackBar';
import { interventionRoute } from '../src/features/routes';
import { AppText, Card, ListItem, Screen, Section, spacing } from '../src/ui';

/** Comfort library: guided exercises as a list; simple ideas as small cards with "Did this help?". */
export default function ComfortScreen() {
  const { t } = useTranslation();
  const guided = INTERVENTIONS.filter((i) => interventionRoute(i.id));
  const ideas = INTERVENTIONS.filter((i) => !interventionRoute(i.id));

  return (
    <Screen>
      <AppText tone="muted">{t('comfort.subtitle')}</AppText>
      <Section>
        {guided.map((item) => {
          const route = interventionRoute(item.id);
          return (
            <ListItem
              key={item.id}
              title={t(`interventions.${item.id}.title`)}
              subtitle={`${t('common.minutes', { count: item.minutes })} · ${t(`interventions.${item.id}.why`)}`}
              chevron
              onPress={() => route && router.push(route)}
            />
          );
        })}
      </Section>

      <View style={{ gap: spacing.md }}>
        <AppText variant="label" tone="muted">
          {t('comfort.ideas')}
        </AppText>
        {ideas.map((item) => (
          <Card key={item.id}>
            <AppText variant="heading">{t(`interventions.${item.id}.title`)}</AppText>
            <AppText>{t(`interventions.${item.id}.howTo`)}</AppText>
            <FeedbackBar id={item.id} />
          </Card>
        ))}
      </View>
    </Screen>
  );
}
