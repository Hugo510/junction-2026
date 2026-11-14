import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ConsultReason, PerceivedUrgency } from '../src/domain/entities';
import { QueueStatus } from '../src/features/QueueStatus';
import { useData, type ConsultOutcome } from '../src/store/data';
import { AppText, Button, Card, Chip, ChipGroup, Screen, spacing } from '../src/ui';

const REASONS: ConsultReason[] = ['moodLower', 'sleep', 'worried', 'treatment', 'talk'];
const URGENCY: PerceivedUrgency[] = ['low', 'medium', 'high'];

/** Consultation request: always created by the patient (never automatically). */
export default function ConsultScreen() {
  const { t } = useTranslation();
  const requestConsult = useData((s) => s.requestConsult);
  const [reason, setReason] = useState<ConsultReason | null>(null);
  const [urgency, setUrgency] = useState<PerceivedUrgency | null>(null);
  const [saving, setSaving] = useState(false);
  const [outcome, setOutcome] = useState<ConsultOutcome | null>(null);

  const submit = async () => {
    if (!reason || !urgency) return;
    setSaving(true);
    try {
      setOutcome(await requestConsult(reason, urgency));
    } finally {
      setSaving(false);
    }
  };

  if (outcome?.channel === 'urgent') {
    return (
      <Screen footer={<Button title={t('common.close')} variant="secondary" onPress={() => router.back()} />}>
        <AppText variant="title">{t('care.consult.resultTitle')}</AppText>
        <Card tone="danger">
          <AppText>{t('care.consult.urgentRouted')}</AppText>
          <Button title={t('common.needHelp')} variant="danger" onPress={() => router.replace('/crisis')} />
        </Card>
      </Screen>
    );
  }

  if (outcome?.channel === 'normalQueue') {
    const { request } = outcome;
    return (
      <Screen footer={<Button title={t('common.done')} onPress={() => router.back()} />}>
        <AppText variant="title">{t('care.consult.resultTitle')}</AppText>
        <Card tone="soft">
          <QueueStatus request={request} />
        </Card>
        <Card>
          <AppText variant="heading">{t('care.consult.whyTitle')}</AppText>
          <AppText variant="caption" tone="muted">
            {t('care.priorityLabel', { level: t(`priority.level.${request.priority.level}`) })} ({request.priority.score}/100)
          </AppText>
          {request.priority.reasons.length === 0 ? (
            <AppText>{t('care.consult.noReasons')}</AppText>
          ) : (
            request.priority.reasons.map((key) => <AppText key={key}>• {t(key)}</AppText>)
          )}
        </Card>
        <AppText variant="caption" tone="muted">
          {t('care.consult.unsafe')}
        </AppText>
      </Screen>
    );
  }

  return (
    <Screen
      footer={<Button title={t('care.consult.submit')} onPress={submit} disabled={!reason || !urgency} loading={saving} />}
    >
      <View style={{ gap: spacing.md }}>
        <AppText variant="heading">{t('care.consult.reasonQuestion')}</AppText>
        <ChipGroup>
          {REASONS.map((r) => (
            <Chip key={r} label={t(`care.consult.reasons.${r}`)} selected={reason === r} onPress={() => setReason(r)} />
          ))}
        </ChipGroup>
      </View>
      <View style={{ gap: spacing.md }}>
        <AppText variant="heading">{t('care.consult.urgencyQuestion')}</AppText>
        <ChipGroup>
          {URGENCY.map((u) => (
            <Chip key={u} label={t(`care.consult.urgency.${u}`)} selected={urgency === u} onPress={() => setUrgency(u)} />
          ))}
        </ChipGroup>
      </View>
      <AppText variant="caption" tone="muted">
        {t('care.consult.unsafe')}
      </AppText>
    </Screen>
  );
}
