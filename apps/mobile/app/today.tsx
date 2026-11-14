import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { daysBetween, lastNDates } from '../src/domain/dates';
import { checkInsByDate, weeklyMoodTrend } from '../src/domain/history';
import { PlanItemCard } from '../src/features/PlanItemCard';
import { usePriority } from '../src/features/usePriority';
import { useCompanionMessage } from '../src/services/companion';
import { useToday } from '../src/store/clock';
import { useData } from '../src/store/data';
import { AppText, Avatar, Button, Card, EmptyState, Screen, Sparkline, spacing, useTheme } from '../src/ui';

export default function TodayScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const today = useToday();
  const patient = useData((s) => s.patient);
  const checkIns = useData((s) => s.checkIns);
  const plan = useData((s) => s.plan);
  const alerts = useData((s) => s.alerts);
  const requests = useData((s) => s.requests);
  const ensureTodayPlan = useData((s) => s.ensureTodayPlan);
  const priority = usePriority();
  const [consultDismissed, setConsultDismissed] = useState(false);

  // New simulated day (demo) or midnight → new plan.
  useEffect(() => {
    if (patient && plan?.date !== today) void ensureTodayPlan();
  }, [patient, plan?.date, today, ensureTodayPlan]);

  const greeting = useCompanionMessage((svc, ctx) => svc.getGreeting(ctx), [today]);

  const byDate = useMemo(() => checkInsByDate(checkIns), [checkIns]);
  const doneToday = byDate.has(today);
  const moodSeries = useMemo(() => lastNDates(today, 14).map((d) => byDate.get(d)?.mood ?? null), [byDate, today]);
  const trend = useMemo(() => weeklyMoodTrend(checkIns, today).trend, [checkIns, today]);
  const urgentToday = alerts.some((a) => a.createdAt.slice(0, 10) === today);
  const recentRequest = requests.some((r) => daysBetween(r.createdAt.slice(0, 10), today) <= 2);
  const showConsultSuggestion = priority.level !== 'low' && !recentRequest && !consultDismissed && !urgentToday;

  if (!patient) {
    return (
      <Screen>
        <EmptyState title={t('common.errorTitle')} body={t('common.errorBody')} action={<Button title={t('common.continue')} onPress={() => router.replace('/start')} />} />
      </Screen>
    );
  }

  const pendingPlan = plan?.items.filter((i) => i.status === 'pending').length ?? 0;

  return (
    <Screen
      footer={
        doneToday ? (
          <Button title={t('today.checkinDone')} variant="secondary" onPress={() => router.push('/checkin')} />
        ) : (
          <Button title={t('today.checkinCta')} onPress={() => router.push('/checkin')} />
        )
      }
    >
      <Card tone="soft">
        <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
          <Avatar
            species={patient.companion.species}
            size={84}
            animated
            accessibilityLabel={t('a11y.companion', { species: t(`species.${patient.companion.species}`), name: patient.companion.name })}
          />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <AppText variant="label" tone="primary">
              {patient.companion.name}
            </AppText>
            <AppText accessibilityLiveRegion="polite">{greeting ?? t('common.loading')}</AppText>
          </View>
        </View>
      </Card>

      {urgentToday ? (
        <Card tone="danger">
          <AppText>{t('today.urgentNotice')}</AppText>
        </Card>
      ) : null}

      {showConsultSuggestion ? (
        <Card tone="accent">
          <AppText variant="heading">{t('today.suggestConsult.title')}</AppText>
          <AppText>{t('companion.suggestConsult', { name: patient.companion.name })}</AppText>
          <Button title={t('today.suggestConsult.cta')} variant="accent" onPress={() => router.push('/consult')} />
          <Button title={t('today.suggestConsult.dismiss')} variant="ghost" onPress={() => setConsultDismissed(true)} />
        </Card>
      ) : null}

      <Card>
        <AppText variant="heading">{t('today.howDoing')}</AppText>
        <AppText>{t(`today.trend.${trend}`)}</AppText>
        {trend !== 'notEnough' ? (
          <Sparkline values={moodSeries} color={colors.chartMood} min={1} max={5} accessibilityLabel={t('a11y.chart', { label: t('today.moodLabel') })} />
        ) : null}
      </Card>

      <Card>
        <AppText variant="heading">{t('today.plan.title')}</AppText>
        <AppText variant="caption" tone="muted">
          {t('today.plan.subtitle')}
        </AppText>
        {plan?.items.map((item) => <PlanItemCard key={item.interventionId} item={item} />)}
        {plan && pendingPlan === 0 && plan.items.some((i) => i.status === 'done') ? (
          <AppText tone="primary" accessibilityLiveRegion="polite">
            {t('today.plan.allDone')}
          </AppText>
        ) : null}
      </Card>
    </Screen>
  );
}
