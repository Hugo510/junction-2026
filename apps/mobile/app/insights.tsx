import { useMemo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { lastNDates } from '../src/domain/dates';
import { average, checkInsByDate, sensorsByDate } from '../src/domain/history';
import { INTERVENTION_IDS } from '../src/domain/interventions';
import { rankInterventions, type ArmStats } from '../src/domain/interventionPicker';
import { useToday } from '../src/store/clock';
import { useData } from '../src/store/data';
import { AppText, BarChart, Card, EmptyState, Screen, Sparkline, spacing, useTheme } from '../src/ui';

const round1 = (v: number) => Math.round(v * 10) / 10;

function rankLabel(s: ArmStats, index: number): string {
  if (index === 0 && s.mean > 0.3) return 'top';
  if (s.mean > 0.3) return 'good';
  if (s.mean >= -0.2) return 'mixed';
  return 'low';
}

export default function InsightsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const today = useToday();
  const checkIns = useData((s) => s.checkIns);
  const sensors = useData((s) => s.sensors);
  const feedback = useData((s) => s.feedback);

  const data = useMemo(() => {
    const days = lastNDates(today, 14);
    const c = checkInsByDate(checkIns);
    const s = sensorsByDate(sensors);
    const series = {
      mood: days.map((d) => c.get(d)?.mood ?? null),
      sleep: days.map((d) => c.get(d)?.sleepHours ?? null),
      activity: days.map((d) => s.get(d)?.activityMinutes ?? null),
      reaction: days.map((d) => c.get(d)?.reaction?.meanMs ?? null),
      daylight: days.map((d) => s.get(d)?.daylightMinutes ?? null),
    };
    const avg = (vals: (number | null)[]) => average(vals.filter((v): v is number => v !== null));
    return { series, avg: { mood: avg(series.mood), sleep: avg(series.sleep), activity: avg(series.activity), reaction: avg(series.reaction), daylight: avg(series.daylight) } };
  }, [checkIns, sensors, today]);

  const ranking = useMemo(() => rankInterventions(INTERVENTION_IDS, feedback, checkIns).filter((r) => r.n > 0), [feedback, checkIns]);

  if (data.avg.mood === undefined && data.avg.activity === undefined) {
    return (
      <Screen>
        <EmptyState title={t('insights.title')} body={t('insights.empty')} />
      </Screen>
    );
  }

  const metric = (
    key: 'mood' | 'sleep' | 'activity' | 'reaction' | 'daylight',
    chart: 'line' | 'bar',
    color: string,
    summary: string | null,
    note?: string,
    range?: { min?: number; max?: number },
  ) => (
    <Card key={key}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
        <AppText variant="heading">{t(`insights.${key}`)}</AppText>
        <AppText variant="caption" tone="muted">
          {summary ?? t('insights.noData')}
        </AppText>
      </View>
      {chart === 'line' ? (
        <Sparkline values={data.series[key]} color={color} min={range?.min} max={range?.max} accessibilityLabel={`${t('a11y.chart', { label: t(`insights.${key}`) })}. ${summary ?? ''}`} />
      ) : (
        <BarChart values={data.series[key]} color={color} max={range?.max} accessibilityLabel={`${t('a11y.chart', { label: t(`insights.${key}`) })}. ${summary ?? ''}`} />
      )}
      {note ? (
        <AppText variant="caption" tone="muted">
          {note}
        </AppText>
      ) : null}
    </Card>
  );

  const { avg } = data;
  return (
    <Screen>
      <AppText tone="muted">{t('insights.subtitle')}</AppText>
      {metric('mood', 'line', colors.chartMood, avg.mood !== undefined ? t('insights.avgMood', { value: round1(avg.mood) }) : null, undefined, { min: 1, max: 5 })}
      {metric('sleep', 'bar', colors.chartSleep, avg.sleep !== undefined ? t('insights.avgHours', { value: round1(avg.sleep) }) : null, undefined, { max: 10 })}
      {metric('activity', 'bar', colors.chartActivity, avg.activity !== undefined ? t('insights.avgMinutes', { value: Math.round(avg.activity) }) : null)}
      {metric('reaction', 'line', colors.chartReaction, avg.reaction !== undefined ? t('insights.avgMs', { value: Math.round(avg.reaction) }) : null, t('insights.reactionNote'))}
      {metric('daylight', 'bar', colors.chartDaylight, avg.daylight !== undefined ? t('insights.avgMinutes', { value: Math.round(avg.daylight) }) : null)}

      <Card tone="soft">
        <AppText variant="heading">{t('insights.helpsTitle')}</AppText>
        <AppText variant="caption" tone="muted">
          {t('insights.helpsBody')}
        </AppText>
        {ranking.length === 0 ? (
          <AppText>{t('insights.helpsEmpty')}</AppText>
        ) : (
          ranking.map((r, i) => (
            <View key={r.id} style={{ paddingVertical: spacing.xs, gap: 2 }}>
              <AppText variant="label">
                {i + 1}. {t(`interventions.${r.id}.title`)}
              </AppText>
              <AppText variant="caption" tone="muted">
                {t(`insights.rank.${rankLabel(r, i)}`)} · {t('insights.tried', { count: r.n })}
              </AppText>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}
