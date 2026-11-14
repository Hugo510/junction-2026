import { addDaysISO, lastNDates, type ISODate } from './dates';
import type { CheckIn, SensorAggregate } from './entities';
import { average, checkInsByDate, sensorsByDate } from './history';
import { eveningMinutes } from './priorityScore';
import { mulberry32 } from './rng';

/**
 * SIMULATED wearable (watch, ring or band).
 *
 * No real device is read: Expo Go cannot reach HealthKit / Health Connect / Bluetooth. This file
 * produces the daily totals such a device would give, deterministically (same day, same values)
 * and shaped by the person's OWN data so the story stays consistent: someone whose evenings run
 * later sleeps less, someone who moves less takes fewer steps.
 *
 * The real version keeps this exact shape: three daily totals, never raw signals or location.
 */
export type WearableDevice = 'watch' | 'ring' | 'band';
export const WEARABLE_DEVICES: readonly WearableDevice[] = ['watch', 'ring', 'band'];

export interface WearableDay {
  date: ISODate;
  /** Hours asleep in the night that ended on `date`. */
  sleepHours: number;
  steps: number;
  /** Beats per minute at rest. */
  restingHr: number;
}

const WAKE_AFTER_NOON_MIN = 19 * 60; // 07:00
const USUAL_SCREEN_OFF_MIN = 11 * 60 + 30; // 23:30
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

function hashDate(date: ISODate): number {
  let h = 2166136261;
  for (let i = 0; i < date.length; i++) h = Math.imul(h ^ date.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** One simulated day. `checkIn` / `sensor` are the person's own entries for that date, if any. */
export function simulateWearableDay(date: ISODate, checkIn?: CheckIn, sensor?: SensorAggregate): WearableDay {
  const rng = mulberry32(hashDate(date));
  const noise = (spread: number) => (rng() * 2 - 1) * spread;

  let sleepHours: number;
  if (typeof checkIn?.sleepHours === 'number') {
    // A measured night sits close to what the person reported.
    sleepHours = checkIn.sleepHours + noise(0.3);
  } else if (sensor?.screenOffTime) {
    // Later evenings: people also get up a little later, but not by as much.
    const off = eveningMinutes(sensor.screenOffTime);
    const wake = WAKE_AFTER_NOON_MIN + Math.max(0, off - USUAL_SCREEN_OFF_MIN) * 0.4;
    sleepHours = (wake - off - 20) / 60 + noise(0.25);
  } else {
    sleepHours = 7.2 + noise(0.5);
  }
  sleepHours = round1(clamp(sleepHours, 4, 9.8));

  const steps = Math.round(clamp(sensor?.steps ?? (sensor?.activityMinutes ?? 25) * 95 + 1800 + noise(450), 300, 22000));
  // Resting heart rate drifts up a little after short nights.
  const restingHr = Math.round(clamp(61 + (7.5 - sleepHours) * 1.6 + noise(2), 48, 88));
  return { date, sleepHours, steps, restingHr };
}

/** The last `days` days up to and including `today`, oldest first. */
export function simulateWearable(input: { checkIns: CheckIn[]; sensors: SensorAggregate[]; today: ISODate; days?: number }): WearableDay[] {
  const checks = checkInsByDate(input.checkIns);
  const sensors = sensorsByDate(input.sensors);
  return lastNDates(input.today, input.days ?? 60)
    .slice()
    .sort()
    .map((date) => simulateWearableDay(date, checks.get(date), sensors.get(date)));
}

/**
 * Adds the wearable totals to the phone's daily aggregates. Only existing days are enriched
 * (a new empty day would look like "no activity" to the activity rule), and steps the phone
 * already has are kept.
 */
export function mergeWearable(sensors: SensorAggregate[], days: WearableDay[]): SensorAggregate[] {
  const byDate = new Map(days.map((d) => [d.date, d]));
  return sensors.map((s) => {
    const w = byDate.get(s.date);
    return w ? { ...s, steps: s.steps ?? w.steps, sleepHours: w.sleepHours, restingHr: w.restingHr } : s;
  });
}

export interface WearableMetric {
  /** Most recent value (last night / yesterday). */
  latest: number | undefined;
  /** Last 7 days, oldest first. */
  week: number[];
  /** The person's own usual: the 3 weeks before the last 7 days. */
  usual: number | undefined;
}

export interface WearableSummary {
  sleep: WearableMetric;
  steps: WearableMetric;
  heart: WearableMetric;
}

/** What the wearable screen shows: latest value, the week, and the person's own usual. */
export function wearableSummary(days: WearableDay[], today: ISODate): WearableSummary {
  const weekStart = addDaysISO(today, -6);
  const usualStart = addDaysISO(today, -27);
  const week = days.filter((d) => d.date >= weekStart && d.date <= today);
  const before = days.filter((d) => d.date >= usualStart && d.date < weekStart);
  const yesterday = addDaysISO(today, -1);
  const metric = (get: (d: WearableDay) => number, latestDate: ISODate, digits: 0 | 1): WearableMetric => {
    const usual = average(before.map(get));
    return {
      latest: days.find((d) => d.date === latestDate) ? get(days.find((d) => d.date === latestDate) as WearableDay) : undefined,
      week: week.map(get),
      usual: usual === undefined ? undefined : digits === 1 ? round1(usual) : Math.round(usual),
    };
  };
  return {
    sleep: metric((d) => d.sleepHours, today, 1),
    steps: metric((d) => d.steps, yesterday, 0),
    heart: metric((d) => d.restingHr, today, 0),
  };
}
