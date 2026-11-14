import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { QueueStatus } from '../src/features/QueueStatus';
import { formatDate } from '../src/i18n';
import { useData } from '../src/store/data';
import { AppText, Avatar, Button, Card, FeatureCard, ListItem, Screen, Section, spacing } from '../src/ui';

/** Care team (fictional) + the patient's requests, as grouped lists. */
export default function CareScreen() {
  const { t } = useTranslation();
  const doctors = useData((s) => s.doctors);
  const requests = useData((s) => s.requests);
  const lastAlert = useData((s) => s.alerts.filter((a) => a.level === 'urgent').pop());

  return (
    <Screen footer={<Button title={t('care.requestCta')} onPress={() => router.push('/consult')} />}>
      <FeatureCard category="leaf" art="care" title={t('menu.care')} description={t('care.subtitle')} />

      {lastAlert ? (
        <Card tone="danger">
          <AppText>{t('care.urgentAlert', { time: formatDate(new Date(lastAlert.createdAt), 'EEE HH:mm') })}</AppText>
        </Card>
      ) : null}

      <Section>
        {doctors.map((d) => (
          <ListItem
            key={d.id}
            leading={<Avatar species="person" size={44} />}
            title={d.name}
            subtitle={[
              t(`care.roles.${d.role}`),
              t('care.speaks', { list: d.languages.map((l) => t(`languages.${l}`)).join(', ') }),
              d.slots[0] ? t('care.nextSlot', { time: formatDate(new Date(d.slots[0]), 'EEEE HH:mm') }) : t('care.noSlot'),
            ].join('\n')}
          />
        ))}
      </Section>

      <Section title={t('care.requestsTitle')}>
        {requests.length === 0 ? (
          <ListItem title={t('care.noRequests')} />
        ) : (
          requests
            .slice()
            .reverse()
            .map((r) => (
              <View key={r.id} style={{ padding: spacing.md }}>
                <QueueStatus request={r} />
              </View>
            ))
        )}
      </Section>
    </Screen>
  );
}
