import { statsForDay, type ReferenceStats } from './baseline';
import { addDaysISO, lastNDates, type ISODate } from './dates';
import { average } from './history';

/**
 * Drift detection (docs/research/trigger_thresholds_pubmed.md).
 *
 * No study gives a fixed "activity down X %" cut-off. What has support is: learn each person's
 * own baseline, run a SMOOTHED trend (an EWMA control chart) and flag it when it stays outside
 * that person's own control limit. So, per signal:
 *
 *   z(day)   = (value − own reference mean for that kind of day) / own reference SD
 *   E(day)   = λ · z(day) + (1 − λ) · E(previous day)             λ = 0.2
 *   limit    = L · sqrt(λ / (2 − λ))                               L = 3  →  limit = 1.0
 *   trigger  = E outside the limit on at least 3 of the last 5 days
 *
 * λ and L are the usual process-control values, not numbers validated for depression. Days
 * without data do not move the trend and do not count: silence is never read as a signal.
 */
export const EWMA_LAMBDA = 0.2;
export const CONTROL_SIGMA = 3;
export const EWMA_LIMIT = CONTROL_SIGMA * Math.sqrt(EWMA_LAMBDA / (2 - EWMA_LAMBDA));
export const OUTSIDE_DAYS_NEEDED = 3;
export const OUTSIDE_WINDOW_DAYS = 5;
export const EWMA_RUN_DAYS = 28;

export interface DriftOptions {
  /** Which side is the worrying one for this signal. */
  direction: 'up' | 'down';
  /** Smallest SD used, in the signal's own unit (protects against a too-quiet reference). */
  minSd: number;
}

export interface Drift {
  /** The smoothed trend for the last EWMA_RUN_DAYS days, oldest first (null before the first value). */
  points: (number | null)[];
  limit: number;
  /** Days of the last 5 on which the trend was outside the person's limit. */
  outsideDays: number;
  triggered: boolean;
  referenceMean: number;
  /** Plain average of the last 7 days with data (for "x vs your usual" texts). */
  recentMean: number | undefined;
}

export function detectDrift(get: (date: ISODate) => number | undefined, reference: ReferenceStats, today: ISODate, opts: DriftOptions): Drift {
  const days = lastNDates(today, EWMA_RUN_DAYS);
  const firstCounted = addDaysISO(today, -(OUTSIDE_WINDOW_DAYS - 1));
  let trend: number | null = null;
  let outsideDays = 0;
  const points: (number | null)[] = [];

  for (const day of days) {
    const value = get(day);
    if (value !== undefined) {
      const ref = statsForDay(day, reference);
      const sd = Math.max(ref.sd, opts.minSd, Math.abs(ref.mean) * 0.05);
      const z = (value - ref.mean) / sd;
      trend = EWMA_LAMBDA * z + (1 - EWMA_LAMBDA) * (trend ?? 0);
      const outside = opts.direction === 'up' ? trend > EWMA_LIMIT : trend < -EWMA_LIMIT;
      if (outside && day >= firstCounted) outsideDays++;
    }
    points.push(trend === null ? null : Math.round(trend * 100) / 100);
  }

  const recent = lastNDates(today, 7)
    .map(get)
    .filter((v): v is number => v !== undefined);
  return {
    points,
    limit: EWMA_LIMIT,
    outsideDays,
    triggered: outsideDays >= OUTSIDE_DAYS_NEEDED,
    referenceMean: reference.pooled.mean,
    recentMean: average(recent),
  };
}

/** How much more a signal swings from day to day than in the person's own reference. */
export const VARIABILITY_RATIO = 1.5;
const MIN_RECENT_FOR_VARIABILITY = 5;

export interface VariabilityRise {
  recentSd: number;
  usualSd: number;
  triggered: boolean;
}

/**
 * Variability (sleep regularity, step swings). Only meaningful once the reference is long
 * enough (the caller checks the phase): estimates from one or two weeks are unreliable.
 */
export function variabilityRise(get: (date: ISODate) => number | undefined, reference: ReferenceStats, today: ISODate, minIncrease: number): VariabilityRise | null {
  const recent = lastNDates(today, 7)
    .map(get)
    .filter((v): v is number => v !== undefined);
  if (recent.length < MIN_RECENT_FOR_VARIABILITY) return null;
  const mean = average(recent) as number;
  const recentSd = Math.sqrt(average(recent.map((v) => (v - mean) ** 2)) as number);
  const usualSd = reference.pooled.sd;
  return { recentSd, usualSd, triggered: recentSd >= usualSd * VARIABILITY_RATIO && recentSd - usualSd >= minIncrease };
}
