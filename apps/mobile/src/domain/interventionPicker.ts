import { addDaysISO } from './dates';
import type { CheckIn, InterventionFeedback, InterventionId } from './entities';
import { checkInsByDate } from './history';
import type { Rng } from './rng';

/**
 * Simple per-user epsilon-greedy bandit.
 *
 * Reward of one feedback = rating (👍 +1, 😐 0, 👎 -1)
 *   + 0.25 × next-day mood change (clamped to ±2 → ±0.5) when both check-ins exist.
 * Each arm starts with one virtual observation of PRIOR_MEAN (mild optimism, so new
 * options get tried). With probability epsilon we explore a random option,
 * otherwise we exploit the best mean.
 */
export const PRIOR_MEAN = 0.1;
export const DEFAULT_EPSILON = 0.2;

export interface ArmStats {
  id: InterventionId;
  /** Number of real feedback observations. */
  n: number;
  mean: number;
}

export function rewardFor(feedback: InterventionFeedback, checkIns: CheckIn[]): number {
  const byDate = checkInsByDate(checkIns);
  const today = byDate.get(feedback.date);
  const next = byDate.get(addDaysISO(feedback.date, 1));
  let reward: number = feedback.rating;
  if (today && next) {
    const delta = Math.max(-2, Math.min(2, next.mood - today.mood));
    reward += 0.25 * delta;
  }
  return reward;
}

export function computeArmStats(
  ids: readonly InterventionId[],
  feedback: InterventionFeedback[],
  checkIns: CheckIn[],
): ArmStats[] {
  return ids.map((id) => {
    const rewards = feedback.filter((f) => f.interventionId === id).map((f) => rewardFor(f, checkIns));
    const sum = rewards.reduce((s, r) => s + r, 0);
    return { id, n: rewards.length, mean: (PRIOR_MEAN + sum) / (1 + rewards.length) };
  });
}

/** Arms sorted from most to least helpful (stable on ties). */
export function rankInterventions(
  ids: readonly InterventionId[],
  feedback: InterventionFeedback[],
  checkIns: CheckIn[],
): ArmStats[] {
  return computeArmStats(ids, feedback, checkIns)
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
}

/** Picks `count` distinct interventions for today's small plan. */
export function pickInterventions(opts: PickOptions): InterventionId[] {
  const { rng, count = 3, epsilon = DEFAULT_EPSILON } = opts;
  let remaining = rankInterventions(opts.ids, opts.feedback, opts.checkIns);
  const picked: InterventionId[] = [];
  while (picked.length < count && remaining.length > 0) {
    const index = rng() < epsilon ? Math.floor(rng() * remaining.length) : 0;
    picked.push(remaining[index].id);
    remaining = remaining.filter((_, i) => i !== index);
  }
  return picked;
}
