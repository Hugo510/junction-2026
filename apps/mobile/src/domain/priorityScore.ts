import { addDaysISO, lastNDates, type ISODate } from './dates';
import type { CheckIn, PerceivedUrgency, PriorityLevel, PriorityResult, SensorAggregate } from './entities';
import { average, checkInsByDate, sensorsByDate, twoWeekWindows } from './history';

/**
 * Priority score (0–100) for a consultation request, with human-readable reasons.
 *
 * Windows: "recent" = the 7 days ending today, "previous" = the 7 days before.
 * Explicit rules (points are added, total is clamped to 0–100):
 *
 * | Rule              | Condition                                                   | Points              |
 * | ----------------- | ----------------------------------------------------------- | ------------------- |
 * | moodDrop          | avg mood recent is ≥ 0.5 lower than previous week           | +10 per 0.5, max 30 |
 * | belowBaseline     | avg mood recent is ≥ 0.5 below the PERSONAL baseline        | +10 per 0.5, max 30 |
 * | lowMood           | avg mood recent ≤ 2.5                                       | +15                 |
 * | missedCheckIns    | ≥ 3 days without check-in in the recent window              | +5 per day ≥3, max 15 |
 * | activityDrop      | avg activity minutes recent ≥ 25 % lower than previous      | +10                 |
 * | reactionSlower    | avg reaction time recent ≥ 10 % slower than previous        | +10                 |
 * | shortSleep        | ≥ 3 recent nights with < 5 h of sleep                       | +15                 |
 * | longSleep         | ≥ 3 recent days with ≥ 10 h of sleep (hypersomnia)          | +15                 |
 * | highAnxiety       | avg anxiety recent ≥ 4                                      | +10                 |
 * | perceivedUrgency  | patient-perceived urgency: high +15, medium +5              | +5 / +15            |
 * | upwardDrift       | ONLY with the clinic's bipolar flag: ≥ 3 recent nights < 6 h | +25                 |
 * |                   | AND energy ≥ 1 above usual OR activity ≥ 30 % above previous |                     |
 *
 * Personal baseline = avg mood of days 15–60 before today (needs ≥ 5 entries). It keeps the signal
 * alive when someone stays low for weeks (week-over-week drop goes to 0, but they are still unwell).
 * moodDrop and belowBaseline describe the same change, so only the larger one adds points
 * (both reasons are shown when both apply).
 * Sleep is two-sided: depression can mean much less OR much more sleep.
 *
 * Levels: score ≥ 60 → high, ≥ 30 → medium, otherwise low.
 *
 * This is a triage aid for the care team's queue, NOT a diagnosis.
 * Safety answers are handled separately by riskRules (always "urgent").
 */
export interface PriorityInput {
  checkIns: CheckIn[];
  sensors: SensorAggregate[];
  today: ISODate;
  perceivedUrgency?: PerceivedUrgency;
  /** Clinic-set flags (never self-declared). */
  flags?: { bipolar?: boolean };
}

export const PRIORITY_THRESHOLDS = { high: 60, medium: 30 } as const;

export const SLEEP_SHORT_H = 5;
export const SLEEP_LONG_H = 10;
export const MIN_BASELINE_ENTRIES = 5;

/** Days 15–60 before today: the person's own "usual" before the two windows we compare. */
export function baselineWindow(today: ISODate): ISODate[] {
  return lastNDates(addDaysISO(today, -14), 46);
}

const REASON = (key: string) => `priority.reasons.${key}`;

export const UPWARD_SLEEP_H = 6;

/**
 * Short sleep together with HIGHER energy or activity than usual. For flagged users this is a
 * signal for the clinician — the companion must never praise it as "doing great".
 */
export function detectUpwardDrift(input: Pick<PriorityInput, 'checkIns' | 'sensors' | 'today'>): boolean {
  const { previous, recent } = twoWeekWindows(input.today);
  const checks = checkInsByDate(input.checkIns);
  const sensors = sensorsByDate(input.sensors);
  const pick = <T>(dates: ISODate[], get: (d: ISODate) => T | undefined) =>
    dates.map(get).filter((v): v is T => v !== undefined);

  const shortNights = pick(recent, (d) => checks.get(d)?.sleepHours).filter((h) => h < UPWARD_SLEEP_H).length;
  if (shortNights < 3) return false;

  const energyRecent = average(pick(recent, (d) => checks.get(d)?.energy));
  const energyUsual =
    average(pick(baselineWindow(input.today), (d) => checks.get(d)?.energy)) ?? average(pick(previous, (d) => checks.get(d)?.energy)) ?? 3;
  const energyUp = energyRecent !== undefined && energyRecent >= energyUsual + 1;

  const actRecent = average(pick(recent, (d) => sensors.get(d)?.activityMinutes));
  const actPrev = average(pick(previous, (d) => sensors.get(d)?.activityMinutes));
  const activityUp = actRecent !== undefined && actPrev !== undefined && actPrev > 0 && actRecent >= actPrev * 1.3;

  return energyUp || activityUp;
}

export function levelForScore(score: number): PriorityLevel {
  if (score >= PRIORITY_THRESHOLDS.high) return 'high';
  if (score >= PRIORITY_THRESHOLDS.medium) return 'medium';
  return 'low';
}

export function priorityScore(input: PriorityInput): PriorityResult {
  const { previous, recent } = twoWeekWindows(input.today);
  const checks = checkInsByDate(input.checkIns);
  const sensors = sensorsByDate(input.sensors);

  const values = <T>(dates: ISODate[], get: (d: ISODate) => T | undefined): T[] =>
    dates.map(get).filter((v): v is T => v !== undefined);

  let score = 0;
  const reasons: string[] = [];
  const add = (points: number, key: string) => {
    if (points <= 0) return;
    score += points;
    reasons.push(REASON(key));
  };

  // Mood: week-over-week change and change vs the person's own baseline (no double counting)
  const moodRecent = average(values(recent, (d) => checks.get(d)?.mood));
  const moodPrev = average(values(previous, (d) => checks.get(d)?.mood));
  const baselineMoods = values(baselineWindow(input.today), (d) => checks.get(d)?.mood);
  const baseline = baselineMoods.length >= MIN_BASELINE_ENTRIES ? average(baselineMoods) : undefined;
  const dropPoints = (drop: number) => (drop >= 0.5 ? Math.min(30, Math.floor(drop / 0.5) * 10) : 0);
  if (moodRecent !== undefined) {
    const weekPoints = moodPrev !== undefined ? dropPoints(moodPrev - moodRecent) : 0;
    const basePoints = baseline !== undefined ? dropPoints(baseline - moodRecent) : 0;
    if (weekPoints > 0 || basePoints > 0) {
      score += Math.max(weekPoints, basePoints);
      if (weekPoints > 0) reasons.push(REASON('moodDrop'));
      if (basePoints > 0) reasons.push(REASON('belowBaseline'));
    }
  }
  if (moodRecent !== undefined && moodRecent <= 2.5) add(15, 'lowMood');

  // Missed check-ins (only counted once the patient has some history)
  if (input.checkIns.length > 0) {
    const missed = recent.filter((d) => !checks.has(d)).length;
    if (missed >= 3) add(Math.min(15, (missed - 2) * 5), 'missedCheckIns');
  }

  // Activity
  const actRecent = average(values(recent, (d) => sensors.get(d)?.activityMinutes));
  const actPrev = average(values(previous, (d) => sensors.get(d)?.activityMinutes));
  if (actRecent !== undefined && actPrev !== undefined && actPrev > 0) {
    if ((actPrev - actRecent) / actPrev >= 0.25) add(10, 'activityDrop');
  }

  // Reaction time (higher = slower)
  const rtRecent = average(values(recent, (d) => checks.get(d)?.reaction?.meanMs));
  const rtPrev = average(values(previous, (d) => checks.get(d)?.reaction?.meanMs));
  if (rtRecent !== undefined && rtPrev !== undefined && rtPrev > 0) {
    if ((rtRecent - rtPrev) / rtPrev >= 0.1) add(10, 'reactionSlower');
  }

  // Sleep (two-sided)
  const sleep = values(recent, (d) => checks.get(d)?.sleepHours);
  if (sleep.filter((h) => h < SLEEP_SHORT_H).length >= 3) add(15, 'shortSleep');
  if (sleep.filter((h) => h >= SLEEP_LONG_H).length >= 3) add(15, 'longSleep');

  // Anxiety
  const anxRecent = average(values(recent, (d) => checks.get(d)?.anxiety));
  if (anxRecent !== undefined && anxRecent >= 4) add(10, 'highAnxiety');

  // Patient-perceived urgency
  if (input.perceivedUrgency === 'high') add(15, 'perceivedUrgency');
  else if (input.perceivedUrgency === 'medium') add(5, 'perceivedUrgency');

  // Upward drift (possible hypomania) — only for people the clinic flagged as bipolar.
  if (input.flags?.bipolar && detectUpwardDrift(input)) add(25, 'upwardDrift');

  const clamped = Math.max(0, Math.min(100, score));
  return { score: clamped, level: levelForScore(clamped), reasons };
}
