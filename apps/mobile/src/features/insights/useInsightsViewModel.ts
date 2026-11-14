import { useMemo } from 'react';

import { lastNDates } from '../../domain/dates';
import type { InterventionId } from '../../domain/entities';
import { average, checkInsByDate, sensorsByDate, weeklyMoodTrend } from '../../domain/history';
import { INTERVENTION_IDS } from '../../domain/interventions';
import { rankInterventions, type ArmStats } from '../../domain/interventionPicker';
import { useToday } from '../../store/clock';
import { useData } from '../../store/data';

export type MetricKey = 'mood' | 'sleep' | 'activity' | 'reaction' | 'daylight';
export type RankLabel = 'top' | 'good' | 'mixed' | 'low';

/** 14-day mood series + weekly trend (used by the chat card and the trends tab). */
export function useMoodTrend() {
  const checkIns = useData((s) => s.checkIns);
  const today = useToday();
  return useMemo(() => {
    const byDate = checkInsByDate(checkIns);
    return {
      series: lastNDates(today, 14).map((d) => byDate.get(d)?.mood ?? null),
      trend: weeklyMoodTrend(checkIns, today).trend,
    };
  }, [checkIns, today]);
}

/** The one action that has helped this person most so far (null until there is real feedback). */
export function useTopHelp(): InterventionId | null {
  const checkIns = useData((s) => s.checkIns);
  const feedback = useData((s) => s.feedback);
  return useMemo(() => {
    const top = rankInterventions(INTERVENTION_IDS, feedback, checkIns).find((r) => r.n > 0);
    return top && top.mean > 0.3 ? top.id : null;
  }, [checkIns, feedback]);
}

function rankLabel(s: ArmStats, index: number): RankLabel {
  if (index === 0 && s.mean > 0.3) return 'top';
  if (s.mean > 0.3) return 'good';
  if (s.mean >= -0.2) return 'mixed';
  return 'low';
}

/** View model for Trends: series, averages and "what helps you" (no UI here). */
export function useInsightsViewModel() {
  const today = useToday();
  const checkIns = useData((s) => s.checkIns);
  const sensors = useData((s) => s.sensors);
  const feedback = useData((s) => s.feedback);

  return useMemo(() => {
    const days = lastNDates(today, 14);
    const c = checkInsByDate(checkIns);
    const s = sensorsByDate(sensors);
    const series: Record<MetricKey, (number | null)[]> = {
      mood: days.map((d) => c.get(d)?.mood ?? null),
      sleep: days.map((d) => c.get(d)?.sleepHours ?? null),
      activity: days.map((d) => s.get(d)?.activityMinutes ?? null),
      reaction: days.map((d) => c.get(d)?.reaction?.meanMs ?? null),
      daylight: days.map((d) => s.get(d)?.daylightMinutes ?? null),
    };
    const avg = (vals: (number | null)[]) => average(vals.filter((v): v is number => v !== null));
    const averages: Record<MetricKey, number | undefined> = {
      mood: avg(series.mood),
      sleep: avg(series.sleep),
      activity: avg(series.activity),
      reaction: avg(series.reaction),
      daylight: avg(series.daylight),
    };
    const ranking = rankInterventions(INTERVENTION_IDS, feedback, checkIns)
      .filter((r) => r.n > 0)
      .map((r, i) => ({ ...r, label: rankLabel(r, i) }));
    return { series, averages, ranking, empty: averages.mood === undefined && averages.activity === undefined };
  }, [checkIns, sensors, feedback, today]);
}
