import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePriority } from '../src/features/usePriority';
import { formatDate } from '../src/i18n';
import { haptics } from '../src/services/haptics';
import { now } from '../src/store/clock';
import { useChat } from '../src/store/chat';
import { useData } from '../src/store/data';
import { useSettings } from '../src/store/settings';
import { AppText, Button, Card, Screen } from '../src/ui';

/**
 * Hidden demo mode for the pitch (long-press the logo in Settings for 2 s).
 * Suggested 2-minute script: Seed good week → Today/Insights → Seed declining week →
 * Today shows the companion suggesting a consultation → Request one in Care (high priority, 1st in line)
 * → Trigger urgent check-in to show the crisis path.
 */
export default function DemoScreen() {
  const { t } = useTranslation();
  const seedScenario = useData((s) => s.seedScenario);
  const ensureTodayPlan = useData((s) => s.ensureTodayPlan);
  const submitCheckIn = useData((s) => s.submitCheckIn);
  const deleteEverything = useData((s) => s.deleteEverything);
  const advanceDay = useSettings((s) => s.advanceDay);
  const dayOffset = useSettings((s) => s.dayOffset);
  const resetSettings = useSettings((s) => s.reset);
  const priority = usePriority();
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const run = (key: string, action: () => Promise<void> | void) => async () => {
    setBusy(key);
    try {
      await action();
      haptics.confirm();
      setDone(key);
    } finally {
      setBusy(null);
    }
  };

  const actions: { key: string; variant?: 'primary' | 'secondary' | 'danger'; action: () => Promise<void> | void }[] = [
    { key: 'seedGood', action: () => seedScenario('good').then(() => useChat.getState().reset()) },
    { key: 'seedDeclining', action: () => seedScenario('declining').then(() => useChat.getState().reset()) },
    {
      key: 'triggerUrgent',
      variant: 'danger',
      action: async () => {
        await submitCheckIn({ mood: 1, energy: 1, anxiety: 5, sleepHours: 4, safetyConcern: true });
        router.push({ pathname: '/crisis', params: { urgent: '1' } });
      },
    },
    {
      key: 'advanceDay',
      variant: 'secondary',
      action: async () => {
        advanceDay();
        await ensureTodayPlan();
      },
    },
    {
      key: 'reset',
      variant: 'secondary',
      action: async () => {
        await deleteEverything();
        await useChat.getState().reset();
        resetSettings();
        await useSettings.persist.clearStorage();
        if (router.canDismiss()) router.dismissAll();
        router.replace('/start');
      },
    },
  ];

  return (
    <Screen>
      <AppText tone="muted">{t('demo.subtitle')}</AppText>
      <Card tone="sand">
        <AppText>{t('demo.simulatedDate', { date: formatDate(now(), 'EEEE d MMMM') })}</AppText>
        <AppText variant="label" key={dayOffset}>
          {t('demo.priorityNow', { score: priority.score, level: t(`priority.level.${priority.level}`) })}
        </AppText>
      </Card>
      {actions.map(({ key, variant, action }) => (
        <Button
          key={key}
          title={done === key ? `${t(`demo.${key}`)} — ${t('demo.doneToast')}` : t(`demo.${key}`)}
          variant={variant ?? 'primary'}
          loading={busy === key}
          onPress={run(key, action)}
        />
      ))}
    </Screen>
  );
}
