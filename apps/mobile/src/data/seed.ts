import { addDaysISO, type ISODate } from '../domain/dates';
import type {
  CheckIn,
  EmotionId,
  FeedbackRating,
  InterventionFeedback,
  InterventionId,
  Scale5,
  SensorAggregate,
} from '../domain/entities';
import { mulberry32, randomBetween, type Rng } from '../domain/rng';

/**
 * Deterministic generator of SYNTHETIC history. No real patient data is used.
 * Same scenario + end date + seed => identical history.
 */
export type SeedScenario = 'good' | 'declining';

export interface SeedResult {
  checkIns: CheckIn[];
  sensors: SensorAggregate[];
  feedback: InterventionFeedback[];
}

export const DEFAULT_SEED = 2026;

/** Deterministic feelings for synthetic entries (no randomness, so the RNG sequence is unchanged). */
const EMOTIONS_BY_MOOD: Record<Scale5, EmotionId[][]> = {
  5: [['proud', 'content'], ['grateful', 'calm']],
  4: [['calm', 'content'], ['hopeful'], ['grateful', 'calm']],
  3: [['tired'], ['calm', 'tired'], ['content']],
  2: [['sad', 'tired'], ['anxious'], ['lonely', 'tired']],
  1: [['numb', 'sad'], ['overwhelmed', 'anxious']],
};

const toScale = (v: number): Scale5 => Math.max(1, Math.min(5, Math.round(v))) as Scale5;
const round1 = (v: number) => Math.round(v * 10) / 10;

interface DayProfile {
  mood: number;
  energy: number;
  anxiety: number;
  sleep: number;
  activity: number;
  daylight: number;
  reaction: number;
  skip: boolean;
}

function profileFor(scenario: SeedScenario, dayIndex: number, days: number, rng: Rng): DayProfile {
  const good: DayProfile = {
    mood: randomBetween(rng, 3.6, 4.6),
    energy: randomBetween(rng, 3.2, 4.4),
    anxiety: randomBetween(rng, 1.5, 2.6),
    sleep: randomBetween(rng, 6.8, 8.2),
    activity: randomBetween(rng, 40, 70),
    daylight: randomBetween(rng, 35, 80),
    reaction: randomBetween(rng, 305, 350),
    skip: false,
  };
  const half = Math.floor(days / 2);
  if (scenario === 'good' || dayIndex < half) return good;

  // Declining: second half gets progressively harder.
  const t = (dayIndex - half + 1) / (days - half); // 0..1
  return {
    mood: randomBetween(rng, 3.0, 3.6) - 1.4 * t,
    energy: randomBetween(rng, 2.6, 3.2) - 1.2 * t,
    anxiety: randomBetween(rng, 3.0, 3.6) + 1.2 * t,
    sleep: randomBetween(rng, 4.0, 5.2) - 0.4 * t,
    activity: randomBetween(rng, 15, 28) - 6 * t,
    daylight: randomBetween(rng, 5, 20),
    reaction: randomBetween(rng, 380, 420) + 40 * t,
    skip: dayIndex === days - 4 || dayIndex === days - 2,
  };
}

/**
 * History for the `days` days that END at `endDate` (inclusive).
 * Usually called with endDate = yesterday so "today" is left for the user.
 */
export function generateHistory(
  scenario: SeedScenario,
  endDate: ISODate,
  days = 14,
  seed = DEFAULT_SEED,
): SeedResult {
  const rng = mulberry32(seed + (scenario === 'good' ? 0 : 1000));
  const checkIns: CheckIn[] = [];
  const sensors: SensorAggregate[] = [];

  for (let i = 0; i < days; i++) {
    const date = addDaysISO(endDate, i - (days - 1));
    const p = profileFor(scenario, i, days, rng);
    sensors.push({ date, activityMinutes: Math.round(p.activity), daylightMinutes: Math.round(p.daylight) });
    if (p.skip) continue;
    const mood = toScale(p.mood);
    checkIns.push({
      id: `seed-${scenario}-${date}`,
      date,
      createdAt: `${date}T19:30:00.000Z`,
      kind: 'full',
      mood,
      emotions: EMOTIONS_BY_MOOD[mood][i % EMOTIONS_BY_MOOD[mood].length],
      energy: toScale(p.energy),
      anxiety: toScale(p.anxiety),
      sleepHours: round1(p.sleep),
      reaction: {
        meanMs: Math.round(p.reaction),
        sdMs: Math.round(randomBetween(rng, 30, 60)),
        accuracy: round1(randomBetween(rng, 0.8, 1)),
        rounds: 8,
      },
      safetyConcern: false,
    });
  }

  const pattern: [InterventionId, FeedbackRating, number][] = [
    ['breathing', 1, 2],
    ['daylightWalk', 1, 3],
    ['puzzle', 0, 5],
    ['fireplace', 1, 6],
    ['reachOut', -1, 8],
    ['breathing', 1, 9],
    ['fish', 0, 11],
    ['daylightWalk', 1, 12],
  ];
  const feedback: InterventionFeedback[] = pattern
    .filter(([, , day]) => day < days)
    .map(([interventionId, rating, day]) => {
      const date = addDaysISO(endDate, day - (days - 1));
      return { id: `seed-fb-${interventionId}-${date}`, interventionId, date, rating };
    });

  return { checkIns, sensors, feedback };
}
