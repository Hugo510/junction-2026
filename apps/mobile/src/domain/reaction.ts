import type { ReactionAggregate } from './entities';
import { average } from './history';

/**
 * Summarises a reaction game. Only the aggregate is kept: individual taps are discarded.
 * @param hitTimesMs reaction times of correct taps
 * @param rounds total rounds played (misses = rounds - hits)
 */
export function summarizeReaction(hitTimesMs: number[], rounds: number): ReactionAggregate {
  const mean = average(hitTimesMs) ?? 0;
  const variance =
    hitTimesMs.length > 1
      ? hitTimesMs.reduce((s, t) => s + (t - mean) ** 2, 0) / (hitTimesMs.length - 1)
      : 0;
  return {
    meanMs: Math.round(mean),
    sdMs: Math.round(Math.sqrt(variance)),
    accuracy: rounds > 0 ? Math.round((hitTimesMs.length / rounds) * 100) / 100 : 0,
    rounds,
  };
}
