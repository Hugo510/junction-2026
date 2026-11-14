import { nightResponse } from './bodyResponse';
import { addDaysISO } from './dates';
import type { CheckIn, InterventionFeedback, InterventionId, SensorAggregate } from './entities';
import { checkInsByDate, sensorsByDate } from './history';
import type { Rng } from './rng';

/**
 * Simple per-user epsilon-greedy bandit.
 *
 * Reward of one feedback = rating (👍 +1, 😐 0, 👎 -1)
 *   + 0.25 × next-day mood change (clamped to ±2 → ±0.5) when both check-ins exist
 *   + BODY_WEIGHT × that night's recovery vs the person's own 14-night baseline, in their own
 *     standard deviations (clamped to ±2 → ±0.5), when a wearable gave both (body loop, B3).
 * So a step is scored by how the person's mood AND body answered, not only by the thumb.
 * Each arm starts with one virtual observation of PRIOR_MEAN (mild optimism, so new
 * options get tried). With probability epsilon we explore a random option,
 * otherwise we exploit the best mean.
 */
export const PRIOR_MEAN = 0.1;
export const DEFAULT_EPSILON = 0.2;

/** Starting mean per action, used instead of PRIOR_MEAN when the person agreed to learn from others. */
export type ArmPriors = Partial<Record<InterventionId, number>>;

/** A prior is only built from at least this many people, each with at least this many ratings. */
export const MIN_PEOPLE_FOR_PRIOR = 2;
export const MIN_RATINGS_PER_PERSON = 2;
const PRIOR_LIMIT = 0.5;

export interface ArmStats {
  id: InterventionId;
  /** Number of real feedback observations. */
  n: number;
  mean: number;
}

/**
 * Weight of the body's answer in the reward. Illustrative and adjustable: we have not studied
 * whether one night's recovery after a step predicts anything about depression.
 */
export const BODY_WEIGHT = 0.25;

export function rewardFor(feedback: InterventionFeedback, checkIns: CheckIn[], sensors: SensorAggregate[] = []): number {
  const byDate = checkInsByDate(checkIns);
  const today = byDate.get(feedback.date);
  const next = byDate.get(addDaysISO(feedback.date, 1));
  let reward: number = feedback.rating;
  if (today && next) {
    const delta = Math.max(-2, Math.min(2, next.mood - today.mood));
    reward += 0.25 * delta;
  }
  // The body's answer: the night after the step against the person's own usual.
  const body = sensors.length > 0 ? nightResponse(feedback.date, sensorsByDate(sensors)) : undefined;
  if (body !== undefined) reward += BODY_WEIGHT * body;
  return reward;
}

export function computeArmStats(
  ids: readonly InterventionId[],
  feedback: InterventionFeedback[],
  checkIns: CheckIn[],
  priors: ArmPriors = {},
  sensors: SensorAggregate[] = [],
): ArmStats[] {
  return ids.map((id) => {
    const rewards = feedback.filter((f) => f.interventionId === id).map((f) => rewardFor(f, checkIns, sensors));
    const sum = rewards.reduce((s, r) => s + r, 0);
    // The prior counts as ONE virtual observation, so the person's own feedback soon outweighs it.
    return { id, n: rewards.length, mean: ((priors[id] ?? PRIOR_MEAN) + sum) / (1 + rewards.length) };
  });
}

/**
 * Loop 3, "many people": a starting point for a new person from what helped others.
 * Only one number per action leaves each person (their mean reward), and an action gets a
 * prior only when at least MIN_PEOPLE_FOR_PRIOR people rated it, so no single person can be
 * read back from it. Used only with the person's consent.
 */
export function populationPriors(
  ids: readonly InterventionId[],
  people: readonly { feedback: InterventionFeedback[]; checkIns: CheckIn[]; sensors?: SensorAggregate[] }[],
): ArmPriors {
  const priors: ArmPriors = {};
  for (const id of ids) {
    const means: number[] = [];
    for (const person of people) {
      const rewards = person.feedback.filter((f) => f.interventionId === id).map((f) => rewardFor(f, person.checkIns, person.sensors));
      if (rewards.length >= MIN_RATINGS_PER_PERSON) means.push(rewards.reduce((s, r) => s + r, 0) / rewards.length);
    }
    if (means.length >= MIN_PEOPLE_FOR_PRIOR) {
      const mean = means.reduce((s, m) => s + m, 0) / means.length;
      priors[id] = Math.max(-PRIOR_LIMIT, Math.min(PRIOR_LIMIT, mean));
    }
  }
  return priors;
}

/** Arms sorted from most to least helpful (stable on ties). */
export function rankInterventions(
  ids: readonly InterventionId[],
  feedback: InterventionFeedback[],
  checkIns: CheckIn[],
  priors: ArmPriors = {},
  sensors: SensorAggregate[] = [],
): ArmStats[] {
  return computeArmStats(ids, feedback, checkIns, priors, sensors)
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s.mean - a.s.mean || a.i - b.i)
    .map(({ s }) => s);
}

export interface PickOptions {
  ids: readonly InterventionId[];
  feedback: InterventionFeedback[];
  checkIns: CheckIn[];
  rng: Rng;
  count?: number;
  epsilon?: number;
  priors?: ArmPriors;
  /** Daily rows with wearable night values, for the body's answer (optional). */
  sensors?: SensorAggregate[];
}

/** Picks `count` distinct interventions for today's small plan. */
export function pickInterventions(opts: PickOptions): InterventionId[] {
  const { rng, count = 3, epsilon = DEFAULT_EPSILON } = opts;
  let remaining = rankInterventions(opts.ids, opts.feedback, opts.checkIns, opts.priors, opts.sensors);
  const picked: InterventionId[] = [];
  while (picked.length < count && remaining.length > 0) {
    const index = rng() < epsilon ? Math.floor(rng() * remaining.length) : 0;
    picked.push(remaining[index].id);
    remaining = remaining.filter((_, i) => i !== index);
  }
  return picked;
}
