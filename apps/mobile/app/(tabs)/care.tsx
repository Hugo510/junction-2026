import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { QueueStatus } from '../../src/features/QueueStatus';
import { formatDate } from '../../src/i18n';
import { useData } from '../../src/store/data';
import { AppText, Avatar, Button, Card, Screen, spacing } from '../../src/ui';

export default function CareScreen() {
  const { t } = useTranslation();
  const doctors = useData((s) => s.doctors);
  const requests = useData((s) => s.requests);
  const alerts = useData((s) => s.alerts);

  return (
    <Screen footer={<Button title={t('care.requestCta')} onPress={() => router.push('/consult')} />}>
      <AppText tone="muted">{t('care.subtitle')}</AppText>

      {alerts
        .slice()
        .reverse()
        .slice(0, 2)
        .map((a) => (
          <Card key={a.id} tone="danger">
            <AppText>{t('care.urgentAlert', { time: formatDate(new Date(a.createdAt), 'EEE HH:mm') })}</AppText>
          </Card>
        ))}

      {doctors.map((d) => (
        <Card key={d.id}>
          <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
            <Avatar species="person" size={56} />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="heading">{d.name}</AppText>
              <AppText variant="caption" tone="muted">
                {t(`care.roles.${d.role}`)}
              </AppText>
            </View>
          </View>
          <AppText variant="caption">{t('care.speaks', { list: d.languages.map((l) => t(`languages.${l}`)).join(', ') })}</AppText>
          <AppText variant="caption" tone="primary">
            {d.slots[0] ? t('care.nextSlot', { time: formatDate(new Date(d.slots[0]), 'EEEE HH:mm') }) : t('care.noSlot')}
          </AppText>
        </Card>
      ))}

      <AppText variant="heading">{t('care.requestsTitle')}</AppText>
      {requests.length === 0 ? (
        <AppText tone="muted">{t('care.noRequests')}</AppText>
      ) : (
        requests
          .slice()
          .reverse()
          .map((r) => (
            <Card key={r.id} tone="soft">
              <QueueStatus request={r} />
            </Card>
          ))
      )}
    </Screen>
  );
}
