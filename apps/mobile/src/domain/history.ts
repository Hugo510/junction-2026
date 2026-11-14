import { lastNDates, type ISODate } from './dates';
import type { CheckIn, SensorAggregate } from './entities';

export function average(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/** Latest check-in per date. */
export function checkInsByDate(checkIns: CheckIn[]): Map<ISODate, CheckIn> {
  const map = new Map<ISODate, CheckIn>();
  for (const c of checkIns) {
    const prev = map.get(c.date);
    if (!prev || prev.createdAt < c.createdAt) map.set(c.date, c);
  }
  return map;
}

export function sensorsByDate(sensors: SensorAggregate[]): Map<ISODate, SensorAggregate> {
  return new Map(sensors.map((s) => [s.date, s]));
}

/** Splits the 14 days ending at `today` into the previous 7 and the recent 7 days. */
export function twoWeekWindows(today: ISODate): { previous: ISODate[]; recent: ISODate[] } {
  const days = lastNDates(today, 14);
  return { previous: days.slice(0, 7), recent: days.slice(7) };
}

export type WeeklyTrend = 'better' | 'steady' | 'harder' | 'notEnough';

/** Human-level trend of mood: recent 7 days vs the 7 days before. */
export function weeklyMoodTrend(checkIns: CheckIn[], today: ISODate): { trend: WeeklyTrend; recentAvg?: number } {
  const byDate = checkInsByDate(checkIns);
  const { previous, recent } = twoWeekWindows(today);
  const pick = (dates: ISODate[]) =>
    dates.map((d) => byDate.get(d)?.mood).filter((m): m is NonNullable<typeof m> => m !== undefined);
  const recentAvg = average(pick(recent));
  const prevAvg = average(pick(previous));
  if (recentAvg === undefined || pick(recent).length < 2) return { trend: 'notEnough', recentAvg };
  if (prevAvg === undefined) return { trend: 'steady', recentAvg };
  const delta = recentAvg - prevAvg;
  if (delta >= 0.4) return { trend: 'better', recentAvg };
  if (delta <= -0.4) return { trend: 'harder', recentAvg };
  return { trend: 'steady', recentAvg };
}
