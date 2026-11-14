import { addDaysISO, lastNDates, type ISODate } from './dates';
import type { CheckIn, EarlySign, PerceivedUrgency, PriorityLevel, PriorityResult, SensorAggregate } from './entities';
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
 * | homeMore          | avg time at home recent ≥ 20 % above the PERSONAL baseline  | +10                 |
 * | laterNights       | avg last screen-off recent ≥ 60 min later than own baseline | +10                 |
 *
 * homeMore and laterNights use what a phone can sense without a wearable (minutes at home, last
 * screen-off of the evening). They compare the person with THEIR OWN usual (days 15–60), never with
 * other people, and they need ≥ 4 recent days and ≥ 5 baseline days of data.
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
  flags?: { bipolar?: boolean; earlySigns?: readonly EarlySign[] };
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

export const HOME_INCREASE_PCT = 20;
export const LATER_NIGHT_MIN = 60;
const MIN_RECENT_SIGNAL_DAYS = 4;

/** "23:40" → minutes after noon, so times around midnight compare correctly (00:30 is later than 23:30). */
export function eveningMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h * 60 + m + 720) % 1440;
}

export interface SignalDrift {
  /** Time at home, recent 7 days vs own baseline, in percent (+40 = 40 % more). */
  homeDeltaPct?: number;
  /** Last screen-off of the evening, recent vs own baseline, in minutes (+100 = 1 h 40 later). */
  screenOffDeltaMin?: number;
}

/** How far the phone-sensed signals are from the person's OWN usual. Also used by the clinician view. */
export function signalDrift(input: Pick<PriorityInput, 'sensors' | 'today'>): SignalDrift {
  const sensors = sensorsByDate(input.sensors);
  const { recent } = twoWeekWindows(input.today);
  const base = baselineWindow(input.today);
  const compare = (get: (d: ISODate) => number | undefined): [number, number] | undefined => {
    const recentValues = recent.map(get).filter((v): v is number => v !== undefined);
    const baseValues = base.map(get).filter((v): v is number => v !== undefined);
    if (recentValues.length < MIN_RECENT_SIGNAL_DAYS || baseValues.length < MIN_BASELINE_ENTRIES) return undefined;
    return [average(recentValues) as number, average(baseValues) as number];
  };

  const drift: SignalDrift = {};
  const home = compare((d) => sensors.get(d)?.homeMinutes);
  if (home && home[1] > 0) drift.homeDeltaPct = Math.round(((home[0] - home[1]) / home[1]) * 100);
  const screenOff = compare((d) => {
    const t = sensors.get(d)?.screenOffTime;
    return t ? eveningMinutes(t) : undefined;
  });
  if (screenOff) drift.screenOffDeltaMin = Math.round(screenOff[0] - screenOff[1]);
  return drift;
}

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
  // What the person reported wins; a connected wearable fills in the nights they did not log.
  // (A check-in reports the night before, so the wearable row is the previous evening's.)
  const measuredSleep = (d: ISODate) => {
    const minutes = sensors.get(addDaysISO(d, -1))?.sleepMinutes;
    return minutes === undefined ? undefined : minutes / 60;
  };
  const sleep = values(recent, (d) => checks.get(d)?.sleepHours ?? measuredSleep(d));
  if (sleep.filter((h) => h < SLEEP_SHORT_H).length >= 3) add(15, 'shortSleep');
  if (sleep.filter((h) => h >= SLEEP_LONG_H).length >= 3) add(15, 'longSleep');

  // Anxiety
  const anxRecent = average(values(recent, (d) => checks.get(d)?.anxiety));
  if (anxRecent !== undefined && anxRecent >= 4) add(10, 'highAnxiety');

  // Patient-perceived urgency
  if (input.perceivedUrgency === 'high') add(15, 'perceivedUrgency');
  else if (input.perceivedUrgency === 'medium') add(5, 'perceivedUrgency');

  // Phone-sensed signals vs the person's own usual
  const drift = signalDrift(input);
  if ((drift.homeDeltaPct ?? 0) >= HOME_INCREASE_PCT) add(10, 'homeMore');
  if ((drift.screenOffDeltaMin ?? 0) >= LATER_NIGHT_MIN) add(10, 'laterNights');

  // Upward drift (possible hypomania) — only for people the clinic flagged as bipolar.
  if (input.flags?.bipolar && detectUpwardDrift(input)) add(25, 'upwardDrift');

  const clamped = Math.max(0, Math.min(100, score));

  // "The clinic tells Hiillos what to watch": early signs set for this person are named first.
  // They change the ORDER of the reasons only, never the score, and never raise an alert.
  const watched = (input.flags?.earlySigns ?? []).map(REASON);
  const clinicSigns = reasons.filter((r) => watched.includes(r));
  if (clinicSigns.length === 0) return { score: clamped, level: levelForScore(clamped), reasons };
  const ordered = [...clinicSigns, ...reasons.filter((r) => !clinicSigns.includes(r))];
  return { score: clamped, level: levelForScore(clamped), reasons: ordered, clinicSigns };
}
