import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { InterventionId } from '../src/domain/entities';
import { availableInterventionIds } from '../src/domain/interventions';
import { rankInterventions } from '../src/domain/interventionPicker';
import { CheckInFlow, type CheckInResult } from '../src/features/CheckInFlow';
import { interventionRoute } from '../src/features/routes';
import { useCompanionMessage } from '../src/services/companion';
import { useToday } from '../src/store/clock';
import { useData } from '../src/store/data';
import { AppText, Avatar, Button, Card, Screen, spacing } from '../src/ui';

export default function CheckInScreen() {
  const { t } = useTranslation();
  const today = useToday();
  const patient = useData((s) => s.patient);
  const checkIns = useData((s) => s.checkIns);
  const feedback = useData((s) => s.feedback);
  const plan = useData((s) => s.plan);
  const sensors = useData((s) => s.sensors);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [again, setAgain] = useState(false);
  const [flowKey, setFlowKey] = useState(0);

  const doneToday = checkIns.some((c) => c.date === today);

  const response = useCompanionMessage(
    (svc, ctx) => (result ? svc.respondToCheckIn(result.checkIn, result.risk, ctx) : Promise.resolve('')),
    [result?.checkIn.id],
  );

  const suggestion: InterventionId = useMemo(() => {
    const pending = plan?.items.find((i) => i.status === 'pending');
    if (pending) return pending.interventionId;
    return rankInterventions(availableInterventionIds({ sensors, today }), feedback, checkIns, {}, sensors)[0].id;
  }, [plan, feedback, checkIns, sensors, today]);

  const onSubmitted = (r: CheckInResult) => {
    setResult(r);
    setAgain(false);
    if (r.risk.level === 'urgent') router.push({ pathname: '/crisis', params: { urgent: '1' } });
  };

  const startAgain = () => {
    setResult(null);
    setAgain(true);
    setFlowKey((k) => k + 1);
  };

  if (result) {
    const route = interventionRoute(suggestion);
    return (
      <Screen footer={<Button title={t('checkin.backToday')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/chat'))} />}>
        <AppText variant="title">{t('checkin.doneTitle')}</AppText>
        {patient ? (
          <Card tone="soft">
            <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
              <Avatar species={patient.companion.species} size={72} animated />
              <AppText style={{ flex: 1 }} accessibilityLiveRegion="polite">
                {response || t('common.loading')}
              </AppText>
            </View>
          </Card>
        ) : null}
        {result.risk.level === 'urgent' ? (
          <Card tone="danger">
            <AppText>{t('crisis.urgentSent')}</AppText>
            <Button title={t('common.needHelp')} variant="danger" onPress={() => router.push('/crisis')} />
          </Card>
        ) : (
          <Card tone="accent">
            <AppText variant="label">{t('checkin.suggestion')}</AppText>
            <AppText variant="heading">{t(`interventions.${suggestion}.title`)}</AppText>
            <AppText tone="muted">{t(`interventions.${suggestion}.why`)}</AppText>
            {route ? (
              <Button title={t('comfort.open')} variant="accent" onPress={() => router.push(route)} />
            ) : (
              <AppText>{t(`interventions.${suggestion}.howTo`)}</AppText>
            )}
          </Card>
        )}
      </Screen>
    );
  }

  if (doneToday && !again) {
    return (
      <Screen>
        <AppText variant="title">{t('checkin.title')}</AppText>
        <Card tone="soft">
          <AppText>{t('checkin.alreadyDone')}</AppText>
        </Card>
        <Button title={t('checkin.again')} variant="secondary" onPress={startAgain} />
      </Screen>
    );
  }

  return (
    <Screen>
      <CheckInFlow key={flowKey} variant="full" onSubmitted={onSubmitted} />
    </Screen>
  );
}
