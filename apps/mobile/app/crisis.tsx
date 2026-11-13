import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CRISIS_RESOURCES, EMERGENCY_NUMBER, displayPhone } from '../src/config/crisisResources';
import { haptics } from '../src/services/haptics';
import { useData } from '../src/store/data';
import { AppText, Button, Card, Screen, spacing } from '../src/ui';

const call = (number: string) => Linking.openURL(`tel:${number}`).catch(() => undefined);

/** Calm crisis screen, reachable from every screen. */
export default function CrisisScreen() {
  const { t } = useTranslation();
  const { urgent } = useLocalSearchParams<{ urgent?: string }>();
  const raiseAlert = useData((s) => s.raiseAlert);
  const [teamNotified, setTeamNotified] = useState(false);

  const contactTeam = async () => {
    await raiseAlert('contactCareTeam');
    haptics.confirm();
    setTeamNotified(true);
  };

  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="display">{t('crisis.title')}</AppText>
        <AppText>{t('crisis.body')}</AppText>
      </View>

      {urgent === '1' ? (
        <Card tone="danger">
          <AppText accessibilityLiveRegion="polite">{t('crisis.urgentSent')}</AppText>
        </Card>
      ) : null}

      <Button
        title={t('crisis.call112')}
        variant="danger"
        accessibilityHint={t('crisis.call112Hint')}
        onPress={() => call(EMERGENCY_NUMBER)}
        style={{ minHeight: 72 }}
      />
      <AppText variant="caption" tone="muted" align="center">
        {t('crisis.call112Hint')}
      </AppText>

      <Card>
        <AppText variant="heading">{t('crisis.linesTitle')}</AppText>
        {CRISIS_RESOURCES.map((r) => (
          <View key={r.id} style={{ gap: spacing.xs, paddingVertical: spacing.xs }}>
            <AppText variant="label">{t(r.nameKey)}</AppText>
            <AppText variant="caption" tone="muted">
              {displayPhone(r.phone)} · {t(r.hoursKey)}
            </AppText>
            <Button size="md" variant="secondary" title={t('crisis.call', { number: displayPhone(r.phone) })} onPress={() => call(r.phone)} />
          </View>
        ))}
      </Card>

      <Card tone="accent">
        {teamNotified ? (
          <AppText accessibilityLiveRegion="polite">{t('crisis.contactTeamSent')}</AppText>
        ) : (
          <Button title={t('crisis.contactTeam')} variant="accent" onPress={contactTeam} />
        )}
      </Card>

      <Button title={t('crisis.breathe')} variant="ghost" onPress={() => router.push('/exercise/breathing')} />
      <AppText variant="caption" tone="muted">
        {t('common.notMedicalDevice')}
      </AppText>
    </Screen>
  );
}
