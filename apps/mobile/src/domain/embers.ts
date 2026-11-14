import { lastNDates, type ISODate } from './dates';
import type { CheckIn, InterventionFeedback, SensorAggregate } from './entities';
import { checkInsByDate, sensorsByDate } from './history';

/**
 * The embers (hiillos) reflect SELF-CARE, never the clinical priority score.
 * - They never go out: there is a floor, so the fire can glow low but never dies.
 * - They change slowly: an exponential moving average over the last 14 days.
 *
 * Daily self-care (0–1): checked in 0.4 · used a comfort action 0.2 ·
 * ≥ 20 active minutes 0.2 · ≥ 15 daylight minutes 0.2.
 */
export const EMBER_FLOOR = 0.25;
const ALPHA = 0.25;
const START = 0.5;

export type EmberState = 'low' | 'steady' | 'bright';

export function dailySelfCare(
  date: ISODate,
  checks: Map<ISODate, CheckIn>,
  sensors: Map<ISODate, SensorAggregate>,
  feedbackDates: Set<ISODate>,
): number {
  const s = sensors.get(date);
  return (
    (checks.has(date) ? 0.4 : 0) +
    (feedbackDates.has(date) ? 0.2 : 0) +
    ((s?.activityMinutes ?? 0) >= 20 ? 0.2 : 0) +
    ((s?.daylightMinutes ?? 0) >= 15 ? 0.2 : 0)
  );
}

/** Ember intensity in [EMBER_FLOOR, 1]. */
export function emberLevel(
  checkIns: CheckIn[],
  sensors: SensorAggregate[],
  feedback: InterventionFeedback[],
  today: ISODate,
  days = 14,
): number {
  const checks = checkInsByDate(checkIns);
  const sens = sensorsByDate(sensors);
  const fb = new Set(feedback.map((f) => f.date));
  let ema = START;
  for (const d of lastNDates(today, days)) ema = ALPHA * dailySelfCare(d, checks, sens, fb) + (1 - ALPHA) * ema;
  return EMBER_FLOOR + (1 - EMBER_FLOOR) * ema;
}

export function emberState(level: number): EmberState {
  if (level >= 0.7) return 'bright';
  if (level >= 0.45) return 'steady';
  return 'low';
}
