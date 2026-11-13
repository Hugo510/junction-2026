import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { simulateQueueProgress } from '../domain/consultQueue';
import type { ConsultRequest } from '../domain/entities';
import { formatDate } from '../i18n';
import { now } from '../store/clock';
import { AppText, spacing } from '../ui';

/** Re-renders every 30 s so the simulated queue visibly moves. */
export function useTick(ms = 30_000): Date {
  const [tick, setTick] = useState(now());
  useEffect(() => {
    const id = setInterval(() => setTick(now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return tick;
}

export function QueueStatus({ request }: { request: ConsultRequest }) {
  const { t } = useTranslation();
  const current = useTick();
  const created = new Date(request.createdAt);
  const progress = simulateQueueProgress(request.initialPosition, created, current);
  return (
    <View style={{ gap: spacing.xs }} accessibilityLiveRegion="polite">
      <AppText variant="label">{t(`care.consult.reasons.${request.reason}`)}</AppText>
      <AppText variant="caption" tone="muted">
        {t('care.sent', { time: formatDate(created, 'EEE HH:mm') })} · {t('care.priorityLabel', { level: t(`priority.level.${request.priority.level}`) })}
      </AppText>
      {progress.status === 'replied' ? (
        <AppText tone="primary">{t('care.replied')}</AppText>
      ) : (
        <AppText>
          {t('care.position', { position: progress.position })} · {t('care.eta', { count: progress.etaHours })}
        </AppText>
      )}
    </View>
  );
}
