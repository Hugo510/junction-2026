import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { INTERVENTIONS } from '../../src/domain/interventions';
import { FeedbackBar } from '../../src/features/FeedbackBar';
import { interventionRoute } from '../../src/features/routes';
import { AppText, Button, Card, Screen, spacing } from '../../src/ui';

/** Library of calming interventions. Each one: duration, why it helps, start, "Did this help?". */
export default function ComfortScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <AppText tone="muted">{t('comfort.subtitle')}</AppText>
      {INTERVENTIONS.map((item) => {
        const route = interventionRoute(item.id);
        const title = t(`interventions.${item.id}.title`);
        return (
          <Card key={item.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
              <AppText variant="heading" style={{ flex: 1 }}>
                {title}
              </AppText>
              <AppText variant="caption" tone="muted">
                {t('common.minutes', { count: item.minutes })}
              </AppText>
            </View>
            <AppText tone="muted">{t(`interventions.${item.id}.why`)}</AppText>
            {route ? (
              <Button title={t('comfort.open')} variant="accent" size="md" onPress={() => router.push(route)} accessibilityLabel={`${t('comfort.open')}: ${title}`} />
            ) : (
              <>
                <AppText>{t(`interventions.${item.id}.howTo`)}</AppText>
                <FeedbackBar id={item.id} />
              </>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}
