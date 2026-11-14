import { MIN_VARIABILITY_VALUES, referenceStats, wellReference, type ReferenceStats, type WellReference } from './baseline';
import { addDaysISO, lastNDates, type ISODate } from './dates';
import { detectDrift, variabilityRise, type Drift, type VariabilityRise } from './drift';
import type { CheckIn, EarlySign, PerceivedUrgency, Phq9Entry, PriorityLevel, PriorityResult, SensorAggregate } from './entities';
import { average, checkInsByDate, sensorsByDate, twoWeekWindows } from './history';

/**
 * Priority score (0–100) for a consultation request, with human-readable reasons.
 *
 * Windows: "recent" = the 7 days ending today, "previous" = the 7 days before.
 * The person's own "usual" is the ANCHORED "last known well" reference of baseline.ts (never a
 * rolling window), with weekdays and weekends apart. Phone and wearable signals are judged by a
 * smoothed trend against the person's own control limit (drift.ts), not by a fixed percentage.
 * Explicit rules (points are added, total is clamped to 0–100):
 *
 * | Rule              | Condition                                                       | Points                |
 * | ----------------- | --------------------------------------------------------------- | --------------------- |
 * | moodDrop          | avg mood recent is ≥ 0.5 lower than previous week               | +10 per 0.5, max 30   |
 * | belowBaseline     | avg mood recent is ≥ 0.5 below the person's own reference       | +10 per 0.5, max 30   |
 * | lowMood           | avg mood recent ≤ 2.5                                           | +15                   |
 * | missedCheckIns    | ≥ 3 days without check-in in the recent window                  | +5 per day ≥3, max 15 |
 * | activityDrop      | activity trend below own limit on ≥ 3 of the last 5 days        | +10                   |
 * | lowSteps          | backup population check: < 5,000 steps on ≥ 5 of the last 7 days | +5                    |
 * | activitySwings    | phase 3: day-to-day activity swings ≥ 1.5 × own usual           | +5                    |
 * | reactionSlower    | avg reaction time recent ≥ 10 % slower than previous            | +10                   |
 * | shortSleep        | ≥ 3 recent nights with < 5 h of sleep                           | +15                   |
 * | longSleep         | ≥ 3 recent days with ≥ 10 h of sleep (hypersomnia)              | +15                   |
 * | highAnxiety       | avg anxiety or worry recent ≥ 4                                 | +10                   |
 * | restless          | avg restless/irritable recent ≥ 4, or "irritable" on ≥ 3 days   | +10                   |
 * | perceivedUrgency  | patient-perceived urgency: high +15, medium +5                  | +5 / +15              |
 * | homeMore          | time-at-home trend above own limit on ≥ 3 of the last 5 days    | +10                   |
 * | laterNights       | last screen-off trend above own limit on ≥ 3 of the last 5 days | +10                   |
 * | irregularNights   | phase 3: night-to-night swings in screen-off ≥ 1.5 × own usual  | +5                    |
 * | upwardDrift       | ONLY with the clinic's bipolar flag: ≥ 3 recent nights < 6 h    | +25                   |
 * |                   | AND energy ≥ 1 above usual OR activity ≥ 30 % above previous    |                       |
 *
 * Staging (docs/research/baseline_design.md): trend rules need a reference (from week 3);
 * variability rules need phase 3 and at least 42 reference days. Before a reference exists,
 * activity falls back to the only comparison available: this week against last week (−25 %).
 * moodDrop and belowBaseline describe the same change, so only the larger one adds points
 * (both reasons are shown when both apply). Sleep is two-sided: depression can mean much less
 * OR much more sleep.
 *
 * Levels: score ≥ 60 → high, ≥ 30 → medium, otherwise low.
 *
 * This is a triage aid for the care team's queue, NOT a diagnosis. The thresholds are design
 * choices, not validated cut-offs. Sensors only make Hiillos ask: no rule here alerts the clinic.
 * Safety answers are handled separately by riskRules (always "urgent").
 */
export interface PriorityInput {
  checkIns: CheckIn[];
  sensors: SensorAggregate[];
  today: ISODate;
  perceivedUrgency?: PerceivedUrgency;
  /** Questionnaires: they confirm which periods were "well" and may update the reference. */
  phq9?: Phq9Entry[];
  /** Clinic-set flags (never self-declared). */
  flags?: { bipolar?: boolean; earlySigns?: readonly EarlySign[] };
}

export const PRIORITY_THRESHOLDS = { high: 60, medium: 30 } as const;

export const SLEEP_SHORT_H = 5;
export const SLEEP_LONG_H = 10;
/** Backup population check (JAMA Netw Open 2024, step bands): fewer than this many steps a day. */
export const LOW_STEPS = 5000;
export const LOW_STEPS_DAYS = 5;

const REASON = (key: string) => `priority.reasons.${key}`;

/** Still used to decide when the wind-down step is offered. */
export const LATER_NIGHT_MIN = 60;
const MIN_RECENT_SIGNAL_DAYS = 4;

/** "23:40" → minutes after noon, so times around midnight compare correctly (00:30 is later than 23:30). */
export function eveningMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h * 60 + m + 720) % 1440;
}

type SignalInput = Pick<PriorityInput, 'sensors' | 'today'> & Partial<Pick<PriorityInput, 'checkIns' | 'phq9'>>;

export type TrendSignal = 'activity' | 'home' | 'screenOff' | 'mood';

export interface PersonalTrends {
  reference: WellReference;
  /** One smoothed trend per signal that has a reference (missing = still learning or no data). */
  trends: Partial<Record<TrendSignal, Drift>>;
  /** Phase 3 only. */
  variability: { nights?: VariabilityRise; activity?: VariabilityRise };
  /** true once the reference is long enough for variability (phase 3 and ≥ 42 reference days). */
  variabilityReady: boolean;
}

/** Everything the drift rules (and the "your normal" screen) need, computed once. */
export function personalTrends(input: SignalInput): PersonalTrends {
  const checks = checkInsByDate(input.checkIns ?? []);
  const sensors = sensorsByDate(input.sensors);
  const reference = wellReference({ checkIns: input.checkIns, sensors: input.sensors, phq9: input.phq9, today: input.today });

  const series: Record<TrendSignal, { get: (d: ISODate) => number | undefined; direction: 'up' | 'down'; minSd: number }> = {
    activity: { get: (d) => sensors.get(d)?.activityMinutes, direction: 'down', minSd: 5 },
    home: { get: (d) => sensors.get(d)?.homeMinutes, direction: 'up', minSd: 30 },
    screenOff: {
      get: (d) => {
        const t = sensors.get(d)?.screenOffTime;
        return t ? eveningMinutes(t) : undefined;
      },
      direction: 'up',
      minSd: 15,
    },
    mood: { get: (d) => checks.get(d)?.mood, direction: 'down', minSd: 0.4 },
  };

  const stats: Partial<Record<TrendSignal, ReferenceStats>> = {};
  const trends: Partial<Record<TrendSignal, Drift>> = {};
  for (const key of Object.keys(series) as TrendSignal[]) {
    const s = series[key];
    const ref = referenceStats(s.get, reference);
    if (!ref) continue;
    stats[key] = ref;
    trends[key] = detectDrift(s.get, ref, input.today, { direction: s.direction, minSd: s.minSd });
  }

  // Variability is only trusted with a long reference (six to eight weeks).
  const ready = (ref: ReferenceStats | undefined): ref is ReferenceStats => reference.phase === 3 && !!ref && ref.pooled.n >= MIN_VARIABILITY_VALUES;
  const steps = (d: ISODate) => sensors.get(d)?.steps;
  const stepsRef = referenceStats(steps, reference);
  const variability: PersonalTrends['variability'] = {};
  if (ready(stats.screenOff)) variability.nights = variabilityRise(series.screenOff.get, stats.screenOff, input.today, 20) ?? undefined;
  if (ready(stepsRef ?? undefined)) variability.activity = variabilityRise(steps, stepsRef as ReferenceStats, input.today, 800) ?? undefined;
  else if (ready(stats.activity)) variability.activity = variabilityRise(series.activity.get, stats.activity, input.today, 8) ?? undefined;

  return { reference, trends, variability, variabilityReady: ready(stats.screenOff) || ready(stats.activity) || ready(stepsRef ?? undefined) };
}

export interface SignalDrift {
  /** Time at home, recent 7 days vs the person's own reference, in percent (+40 = 40 % more). */
  homeDeltaPct?: number;
  /** Last screen-off of the evening, recent vs own reference, in minutes (+100 = 1 h 40 later). */
  screenOffDeltaMin?: number;
}

/** How far the phone-sensed signals are from the person's OWN usual, in plain numbers for texts. */
export function signalDrift(input: SignalInput): SignalDrift {
  const sensors = sensorsByDate(input.sensors);
  const { trends } = personalTrends(input);
  const enough = (get: (d: ISODate) => unknown) => lastNDates(input.today, 7).filter((d) => get(d) !== undefined).length >= MIN_RECENT_SIGNAL_DAYS;

  const drift: SignalDrift = {};
  const home = trends.home;
  if (home && home.recentMean !== undefined && home.referenceMean > 0 && enough((d) => sensors.get(d)?.homeMinutes)) {
    drift.homeDeltaPct = Math.round(((home.recentMean - home.referenceMean) / home.referenceMean) * 100);
  }
  const screenOff = trends.screenOff;
  if (screenOff && screenOff.recentMean !== undefined && enough((d) => sensors.get(d)?.screenOffTime)) {
    drift.screenOffDeltaMin = Math.round(screenOff.recentMean - screenOff.referenceMean);
  }
  return drift;
}

export const UPWARD_SLEEP_H = 6;

/**
 * Short sleep together with HIGHER energy or activity than usual. For flagged users this is a
 * signal for the clinician — the companion must never praise it as "doing great".
 */
export function detectUpwardDrift(input: Pick<PriorityInput, 'checkIns' | 'sensors' | 'today'> & Partial<Pick<PriorityInput, 'phq9'>>): boolean {
  const { previous, recent } = twoWeekWindows(input.today);
  const checks = checkInsByDate(input.checkIns);
  const sensors = sensorsByDate(input.sensors);
  const pick = <T>(dates: ISODate[], get: (d: ISODate) => T | undefined) =>
    dates.map(get).filter((v): v is T => v !== undefined);

  const shortNights = pick(recent, (d) => checks.get(d)?.sleepHours).filter((h) => h < UPWARD_SLEEP_H).length;
  if (shortNights < 3) return false;

  const reference = wellReference({ checkIns: input.checkIns, sensors: input.sensors, phq9: input.phq9, today: input.today });
  const energyRecent = average(pick(recent, (d) => checks.get(d)?.energy));
  const energyUsual = average(pick(reference.days, (d) => checks.get(d)?.energy)) ?? average(pick(previous, (d) => checks.get(d)?.energy)) ?? 3;
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
  const personal = personalTrends(input);

  const values = <T>(dates: ISODate[], get: (d: ISODate) => T | undefined): T[] =>
    dates.map(get).filter((v): v is T => v !== undefined);

  let score = 0;
  const reasons: string[] = [];
  const add = (points: number, key: string) => {
    if (points <= 0) return;
    score += points;
    reasons.push(REASON(key));
  };

  // Mood: week-over-week change and change vs the person's own reference (no double counting)
  const moodRecent = average(values(recent, (d) => checks.get(d)?.mood));
  const moodPrev = average(values(previous, (d) => checks.get(d)?.mood));
  const baseline = personal.trends.mood?.referenceMean;
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

  // Activity: the smoothed trend against the person's own limit. Before a reference exists,
  // the only comparison available is this week against last week.
  const activity = personal.trends.activity;
  if (activity) {
    if (activity.triggered) add(10, 'activityDrop');
  } else {
    const actRecent = average(values(recent, (d) => sensors.get(d)?.activityMinutes));
    const actPrev = average(values(previous, (d) => sensors.get(d)?.activityMinutes));
    if (actRecent !== undefined && actPrev !== undefined && actPrev > 0 && (actPrev - actRecent) / actPrev >= 0.25) add(10, 'activityDrop');
  }
  // Backup population check, independent of the personal baseline.
  const stepDays = values(recent, (d) => sensors.get(d)?.steps);
  if (stepDays.length >= LOW_STEPS_DAYS && stepDays.filter((s) => s < LOW_STEPS).length >= LOW_STEPS_DAYS) add(5, 'lowSteps');
  if (personal.variability.activity?.triggered) add(5, 'activitySwings');

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

  // Anxiety and worry: the same early sign, asked two ways.
  const anxRecent = average(
    values(recent, (d) => {
      const c = checks.get(d);
      return c?.anxiety === undefined && c?.worry === undefined ? undefined : Math.max(c.anxiety ?? 0, c.worry ?? 0);
    }),
  );
  if (anxRecent !== undefined && anxRecent >= 4) add(10, 'highAnxiety');

  // Restlessness / irritability: among the earliest signs in the studies.
  const restless = values(recent, (d) => checks.get(d)?.restlessness);
  const irritableDays = recent.filter((d) => checks.get(d)?.emotions?.includes('irritable')).length;
  if ((restless.length >= 2 && (average(restless) as number) >= 4) || irritableDays >= 3) add(10, 'restless');

  // Patient-perceived urgency
  if (input.perceivedUrgency === 'high') add(15, 'perceivedUrgency');
  else if (input.perceivedUrgency === 'medium') add(5, 'perceivedUrgency');

  // Phone-sensed signals: smoothed trend against the person's own limit
  if (personal.trends.home?.triggered) add(10, 'homeMore');
  if (personal.trends.screenOff?.triggered) add(10, 'laterNights');
  if (personal.variability.nights?.triggered) add(5, 'irregularNights');

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
