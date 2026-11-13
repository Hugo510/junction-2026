import { type ISODate } from './dates';
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
 * | moodDrop          | avg mood recent is ≥ 0.5 lower than previous                | +10 per 0.5, max 30 |
 * | lowMood           | avg mood recent ≤ 2.5                                       | +15                 |
 * | missedCheckIns    | ≥ 3 days without check-in in the recent window              | +5 per day ≥3, max 15 |
 * | activityDrop      | avg activity minutes recent ≥ 25 % lower than previous      | +10                 |
 * | reactionSlower    | avg reaction time recent ≥ 10 % slower than previous        | +10                 |
 * | shortSleep        | ≥ 3 recent nights with < 5 h of sleep                       | +15                 |
 * | highAnxiety       | avg anxiety recent ≥ 4                                      | +10                 |
 * | perceivedUrgency  | patient-perceived urgency: high +15, medium +5              | +5 / +15            |
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
}

export const PRIORITY_THRESHOLDS = { high: 60, medium: 30 } as const;

const REASON = (key: string) => `priority.reasons.${key}`;

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

  // Mood
  const moodRecent = average(values(recent, (d) => checks.get(d)?.mood));
  const moodPrev = average(values(previous, (d) => checks.get(d)?.mood));
  if (moodRecent !== undefined && moodPrev !== undefined) {
    const drop = moodPrev - moodRecent;
    if (drop >= 0.5) add(Math.min(30, Math.floor(drop / 0.5) * 10), 'moodDrop');
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

  // Sleep
  const shortNights = values(recent, (d) => checks.get(d)?.sleepHours).filter((h) => h < 5).length;
  if (shortNights >= 3) add(15, 'shortSleep');

  // Anxiety
  const anxRecent = average(values(recent, (d) => checks.get(d)?.anxiety));
  if (anxRecent !== undefined && anxRecent >= 4) add(10, 'highAnxiety');

  // Patient-perceived urgency
  if (input.perceivedUrgency === 'high') add(15, 'perceivedUrgency');
  else if (input.perceivedUrgency === 'medium') add(5, 'perceivedUrgency');

  const clamped = Math.max(0, Math.min(100, score));
  return { score: clamped, level: levelForScore(clamped), reasons };
}
