import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, BarChart, Card, EmptyState, ListItem, Section, Sparkline, spacing, useTheme } from '../../ui';
import { useInsightsViewModel, type MetricKey } from './useInsightsViewModel';

const round1 = (v: number) => Math.round(v * 10) / 10;

/** Trends tab: 14-day charts in plain words + what seems to help. */
export function InsightsView() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { series, averages, ranking, empty } = useInsightsViewModel();

  if (empty) return <EmptyState title={t('insights.title')} body={t('insights.empty')} />;

  const summary: Record<MetricKey, string | null> = {
    mood: averages.mood !== undefined ? t('insights.avgMood', { value: round1(averages.mood) }) : null,
    sleep: averages.sleep !== undefined ? t('insights.avgHours', { value: round1(averages.sleep) }) : null,
    activity: averages.activity !== undefined ? t('insights.avgMinutes', { value: Math.round(averages.activity) }) : null,
    reaction: averages.reaction !== undefined ? t('insights.avgMs', { value: Math.round(averages.reaction) }) : null,
    daylight: averages.daylight !== undefined ? t('insights.avgMinutes', { value: Math.round(averages.daylight) }) : null,
    home: averages.home !== undefined ? t('insights.avgHoursDay', { value: round1(averages.home) }) : null,
  };
  const metrics: { key: MetricKey; chart: 'line' | 'bar'; color: string; min?: number; max?: number; note?: string }[] = [
    { key: 'mood', chart: 'line', color: colors.chartMood, min: 1, max: 5 },
    { key: 'sleep', chart: 'bar', color: colors.chartSleep, max: 10 },
    { key: 'activity', chart: 'bar', color: colors.chartActivity },
    { key: 'reaction', chart: 'line', color: colors.chartReaction, note: t('insights.reactionNote') },
    { key: 'daylight', chart: 'bar', color: colors.chartDaylight },
    // Shown only when the phone provides time at home
    ...(averages.home !== undefined ? [{ key: 'home' as const, chart: 'bar' as const, color: colors.accent, max: 24 }] : []),
  ];

  return (
    <View style={{ gap: spacing.lg }}>
      <AppText tone="muted">{t('insights.subtitle')}</AppText>
      {metrics.map((m) => {
        const label = `${t('a11y.chart', { label: t(`insights.${m.key}`) })}. ${summary[m.key] ?? ''}`;
        return (
          <Card key={m.key}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
              <AppText variant="heading">{t(`insights.${m.key}`)}</AppText>
              <AppText variant="caption" tone="muted">
                {summary[m.key] ?? t('insights.noData')}
              </AppText>
            </View>
            {m.chart === 'line' ? (
              <Sparkline values={series[m.key]} color={m.color} min={m.min} max={m.max} accessibilityLabel={label} />
            ) : (
              <BarChart values={series[m.key]} color={m.color} max={m.max} accessibilityLabel={label} />
            )}
            {m.note ? (
              <AppText variant="caption" tone="muted">
                {m.note}
              </AppText>
            ) : null}
          </Card>
        );
      })}

      <Section title={t('insights.helpsTitle')} footer={t('insights.helpsBody')}>
        {ranking.length === 0 ? (
          <ListItem title={t('insights.helpsEmpty')} />
        ) : (
          ranking.map((r, i) => (
            <ListItem
              key={r.id}
              title={`${i + 1}. ${t(`interventions.${r.id}.title`)}`}
              subtitle={`${t(`insights.rank.${r.label}`)} · ${t('insights.tried', { count: r.n })}`}
            />
          ))
        )}
      </Section>
    </View>
  );
}
