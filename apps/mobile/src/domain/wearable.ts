import { addDaysISO, lastNDates, type ISODate } from './dates';
import type { CheckIn, SensorAggregate } from './entities';
import { average, checkInsByDate, sensorsByDate } from './history';
import { eveningMinutes } from './priorityScore';
import { mulberry32 } from './rng';

/**
 * Wearable (watch or ring) daily totals.
 *
 * Field names follow docs/MEMO_BODY_LOOP.md (B1): nightHrvMs, restingHr, sleepMinutes, wakeTime,
 * wearMinutes, wearableSource. NIGHT values belong to the date of the EVENING the night starts,
 * like bedtime and screenOffTime: a walk on the 12th and the night after it are on the same row.
 *
 * Where the numbers come from:
 * 1. The persona files, when they carry these fields (synthetic watch data, B2). They always win.
 * 2. Otherwise a SIMULATION, deterministic (same day, same values) and shaped by the person's own
 *    data so the story stays consistent. No real device is read: Expo Go cannot reach HealthKit,
 *    Health Connect or Bluetooth.
 *
 * Only daily totals, never raw signals or location.
 */
export type WearableDevice = 'watch' | 'ring' | 'band';
export const WEARABLE_DEVICES: readonly WearableDevice[] = ['watch', 'ring', 'band'];

export interface WearableDay {
  /** The evening the night starts. */
  date: ISODate;
  sleepMinutes: number;
  steps: number;
  /** Beats per minute at rest. */
  restingHr: number;
  /** Night heart rate variability (RMSSD, ms). Shown as "night-time recovery". */
  nightHrvMs: number;
}

const WAKE_AFTER_NOON_MIN = 19 * 60; // 07:00
const USUAL_SCREEN_OFF_MIN = 11 * 60 + 30; // 23:30
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function hashDate(date: ISODate): number {
  let h = 2166136261;
  for (let i = 0; i < date.length; i++) h = Math.imul(h ^ date.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * One day. `sensor` is the person's own row for that date; `nextCheckIn` is the check-in of the
 * NEXT morning (people report last night's sleep the day after).
 */
export function simulateWearableDay(date: ISODate, nextCheckIn?: CheckIn, sensor?: SensorAggregate): WearableDay {
  const rng = mulberry32(hashDate(date));
  const noise = (spread: number) => (rng() * 2 - 1) * spread;

  let sleepHours: number;
  if (typeof nextCheckIn?.sleepHours === 'number') {
    // A measured night sits close to what the person reported.
    sleepHours = nextCheckIn.sleepHours + noise(0.3);
  } else if (sensor?.screenOffTime) {
    // Later evenings: people also get up a little later, but not by as much.
    const off = eveningMinutes(sensor.screenOffTime);
    const wake = WAKE_AFTER_NOON_MIN + Math.max(0, off - USUAL_SCREEN_OFF_MIN) * 0.4;
    sleepHours = (wake - off - 20) / 60 + noise(0.25);
  } else {
    sleepHours = 7.2 + noise(0.5);
  }
  const simulatedSleep = Math.round(clamp(sleepHours, 4, 9.8) * 60);
  const sleepMinutes = sensor?.sleepMinutes ?? simulatedSleep;
  const hours = sleepMinutes / 60;

  const steps = Math.round(clamp(sensor?.steps ?? (sensor?.activityMinutes ?? 25) * 95 + 1800 + noise(450), 300, 22000));
  // Resting heart rate drifts up a little after short nights; recovery is higher after
  // longer nights and more active days. Illustrative, not calibrated.
  const restingHr = sensor?.restingHr ?? Math.round(clamp(61 + (7.5 - hours) * 1.6 + noise(2), 48, 88));
  const nightHrvMs = sensor?.nightHrvMs ?? Math.round(clamp(42 + (hours - 7) * 4 + ((sensor?.activityMinutes ?? 25) - 25) * 0.15 + noise(4), 15, 110));
  return { date, sleepMinutes, steps, restingHr, nightHrvMs };
}

/** The last `days` nights, oldest first. The newest is last night (the evening of yesterday). */
export function simulateWearable(input: { checkIns: CheckIn[]; sensors: SensorAggregate[]; today: ISODate; days?: number }): WearableDay[] {
  const checks = checkInsByDate(input.checkIns);
  const sensors = sensorsByDate(input.sensors);
  return lastNDates(addDaysISO(input.today, -1), input.days ?? 60)
    .slice()
    .sort()
    .map((date) => simulateWearableDay(date, checks.get(addDaysISO(date, 1)), sensors.get(date)));
}

/**
 * Adds the wearable totals to the phone's daily rows. Only existing days are enriched (a new
 * empty day would look like "no activity" to the activity rule) and values already in the row
 * (persona files, the phone's own steps) are kept.
 */
export function mergeWearable(sensors: SensorAggregate[], days: WearableDay[]): SensorAggregate[] {
  const byDate = new Map(days.map((d) => [d.date, d]));
  return sensors.map((s) => {
    const w = byDate.get(s.date);
    if (!w) return s;
    return {
      ...s,
      steps: s.steps ?? w.steps,
      sleepMinutes: s.sleepMinutes ?? w.sleepMinutes,
      restingHr: s.restingHr ?? w.restingHr,
      nightHrvMs: s.nightHrvMs ?? w.nightHrvMs,
    };
  });
}

export interface WearableMetric {
  /** Last night / yesterday. */
  latest: number | undefined;
  /** Last 7 days, oldest first. */
  week: number[];
  /** The person's own usual: the 3 weeks before the last 7 days. */
  usual: number | undefined;
}

export interface WearableSummary {
  /** Hours. */
  sleep: WearableMetric;
  steps: WearableMetric;
  heart: WearableMetric;
  /** Night heart rate variability, ms. */
  recovery: WearableMetric;
}

/** What the wearable screen shows: latest value, the week, and the person's own usual. */
export function wearableSummary(days: WearableDay[], today: ISODate): WearableSummary {
  const last = addDaysISO(today, -1);
  const weekStart = addDaysISO(last, -6);
  const usualStart = addDaysISO(weekStart, -21);
  const week = days.filter((d) => d.date >= weekStart && d.date <= last);
  const before = days.filter((d) => d.date >= usualStart && d.date < weekStart);
  const latestDay = days.find((d) => d.date === last);
  const metric = (get: (d: WearableDay) => number, digits: 0 | 1): WearableMetric => {
    const usual = average(before.map(get));
    const fix = (v: number) => (digits === 1 ? Math.round(v * 10) / 10 : Math.round(v));
    return { latest: latestDay ? fix(get(latestDay)) : undefined, week: week.map((d) => fix(get(d))), usual: usual === undefined ? undefined : fix(usual) };
  };
  return {
    sleep: metric((d) => d.sleepMinutes / 60, 1),
    steps: metric((d) => d.steps, 0),
    heart: metric((d) => d.restingHr, 0),
    recovery: metric((d) => d.nightHrvMs, 0),
  };
}
