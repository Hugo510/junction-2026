import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PERSONAS } from '../src/data/personas';
import { notificationKey } from '../src/domain/outreach';
import { isPhqDue } from '../src/domain/phq';
import { usePriority } from '../src/features/usePriority';
import { formatDate } from '../src/i18n';
import { haptics } from '../src/services/haptics';
import { now, todayISO } from '../src/store/clock';
import { useChat } from '../src/store/chat';
import { useData } from '../src/store/data';
import { useReachOut } from '../src/store/reachOut';
import { useSettings } from '../src/store/settings';
import { AppText, Button, Card, ListItem, Screen, Section } from '../src/ui';

/**
 * Hidden demo mode for the pitch (long-press the logo in Settings for 2 s).
 * Suggested script: Seed good week → Simulate reach-out → Skip 3 silent days (ladder: warm → friend)
 * → Seed declining week (priority jumps, companion suggests a consultation) → Trigger urgent check-in.
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
  // Latest value for async handlers (advance day → re-render → reach out).
  const priorityRef = useRef(priority);
  priorityRef.current = priority;
  const bipolar = useData((s) => s.patient?.bipolarFlag ?? false);
  const setBipolarFlag = useData((s) => s.setBipolarFlag);
  const checkSilence = useData((s) => s.checkSilence);
  const loadPersona = useData((s) => s.loadPersona);

  /** Show the simulated notification that matches the current silence level. */
  const reachOut = async () => {
    const level = await checkSilence();
    const checkedInToday = useData.getState().checkIns.some((c) => c.date === todayISO());
    const contact = useSettings.getState().trustedContact;
    const drift = isPhqDue(priorityRef.current.level, useData.getState().phq9, todayISO());
    useReachOut.getState().show({ key: notificationKey(level, checkedInToday, !!contact, drift), params: { friend: contact?.name ?? '' } });
  };
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
    { key: 'reachOut', action: reachOut },
    {
      key: 'advanceDay',
      variant: 'secondary',
      action: async () => {
        advanceDay();
        await ensureTodayPlan();
        await reachOut();
      },
    },
    {
      key: 'skipDays',
      variant: 'secondary',
      action: async () => {
        advanceDay();
        advanceDay();
        advanceDay();
        await ensureTodayPlan();
        await reachOut();
      },
    },
    {
      key: bipolar ? 'bipolarOff' : 'bipolarOn',
      variant: 'secondary',
      action: () => setBipolarFlag(!bipolar),
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
      <Button title={t('clinician.title')} variant="secondary" onPress={() => router.push('/clinician')} />
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

      {PERSONAS.length > 0 ? (
        <Section title={t('demo.personasTitle')}>
          {PERSONAS.map((p) => {
            const key = `persona-${p.persona.id}`;
            return (
              <ListItem
                key={key}
                title={p.persona.label}
                subtitle={done === key ? t('demo.doneToast') : p.persona.story}
                chevron
                onPress={run(key, async () => {
                  await loadPersona(p);
                  await useChat.getState().reset();
                })}
              />
            );
          })}
        </Section>
      ) : (
        <AppText variant="caption" tone="muted">
          {t('demo.noPersonas')}
        </AppText>
      )}
    </Screen>
  );
}
