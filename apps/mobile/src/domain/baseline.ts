import { addDaysISO, daysBetween, type ISODate } from './dates';
import type { CheckIn, Phq9Entry, SensorAggregate } from './entities';
import { average } from './history';

/**
 * Each person's own "normal" (docs/research/baseline_design.md).
 *
 * Three rules from the research notes:
 * 1. STAGED. Averages (steps, sleep time, time at home) are usable after about two weeks;
 *    variability (sleep regularity, step swings) needs six to eight weeks.
 * 2. ANCHORED, never a plain rolling window. A rolling window slowly learns a relapse as the
 *    "new normal". The reference is the "last known well" period: the first two weeks after
 *    treatment, plus later two-week blocks ONLY when a questionnaire confirms the person was well.
 * 3. WEEKDAYS AND WEEKENDS APART, because routines differ.
 *
 * The windows and thresholds are the team's design choices, not validated cut-offs.
 */

/** 1 = learning averages, 2 = drift on averages is on, 3 = variability is reliable too. */
export type BaselinePhase = 1 | 2 | 3;

export const AVERAGES_READY_DAYS = 14;
export const VARIABILITY_READY_DAYS = 56;
/** The reference grows in two-week blocks. */
export const BLOCK_DAYS = 14;
/** The most recent days are being evaluated, so they never feed the reference. */
export const EVALUATION_DAYS = 7;
/** At most this many blocks (the latest confirmed ones) make up the reference. */
export const MAX_REFERENCE_BLOCKS = 4;
/** Values needed before an average is trusted, and before variability is trusted. */
export const MIN_REFERENCE_VALUES = 7;
export const MIN_VARIABILITY_VALUES = 42;
/** A weekday / weekend average is used only with this many values of that kind. */
const MIN_DAY_TYPE_VALUES = 4;
/** "Confirmed as well": a questionnaire below these totals near the block. */
export const PHQ9_WELL_BELOW = 10;
export const PHQ2_WELL_BELOW = 3;
const STABLE_MOOD_DROP = 0.5;

export interface ReferenceBlock {
  start: ISODate;
  end: ISODate;
  /** "start" = the first two weeks after treatment; "questionnaire" = confirmed well later. */
  confirmedBy: 'start' | 'questionnaire';
}

export interface WellReference {
  /** First day with any data (undefined = nothing yet). */
  firstDay: ISODate | undefined;
  daysOfData: number;
  phase: BaselinePhase;
  /** The "last known well" blocks, oldest first. */
  blocks: ReferenceBlock[];
  /** Every day inside those blocks. */
  days: ISODate[];
  /** 0–1: how much of the starting picture is the person's own (the rest is a population prior). */
  personalShare: number;
}

export interface BaselineInput {
  checkIns?: CheckIn[];
  sensors?: SensorAggregate[];
  phq9?: Phq9Entry[];
  today: ISODate;
}

function phaseFor(daysOfData: number): BaselinePhase {
  if (daysOfData > VARIABILITY_READY_DAYS) return 3;
  if (daysOfData > AVERAGES_READY_DAYS) return 2;
  return 1;
}

/** The person's "last known well" reference, as of `today`. */
export function wellReference({ checkIns = [], sensors = [], phq9 = [], today }: BaselineInput): WellReference {
  const dates = [...checkIns.map((c) => c.date), ...sensors.map((s) => s.date)].filter((d) => d <= today);
  if (dates.length === 0) return { firstDay: undefined, daysOfData: 0, phase: 1, blocks: [], days: [], personalShare: 0 };

  const firstDay = dates.reduce((min, d) => (d < min ? d : min));
  const daysOfData = daysBetween(firstDay, today) + 1;
  const cutoff = addDaysISO(today, -EVALUATION_DAYS);
  const moodIn = (start: ISODate, end: ISODate) => checkIns.filter((c) => c.date >= start && c.date <= end).map((c) => c.mood as number);
  const startMood = average(moodIn(firstDay, addDaysISO(firstDay, BLOCK_DAYS - 1)));

  const confirmedWell = (start: ISODate, end: ISODate): boolean => {
    // A questionnaire in the block (or the week after it) must say "well", and none may say otherwise.
    const near = phq9.filter((q) => q.date >= start && q.date <= addDaysISO(end, 7));
    const isLow = (q: Phq9Entry) => ((q.kind ?? 'phq9') === 'phq9' ? q.total < PHQ9_WELL_BELOW : q.total < PHQ2_WELL_BELOW);
    if (near.length === 0 || !near.every(isLow)) return false;
    if (checkIns.some((c) => c.date >= start && c.date <= end && c.safetyConcern)) return false;
    // Check-ins must be stable too: mood not clearly below where the person started.
    const mood = average(moodIn(start, end));
    return mood === undefined || startMood === undefined || mood >= startMood - STABLE_MOOD_DROP;
  };

  const blocks: ReferenceBlock[] = [];
  for (let k = 0; ; k++) {
    const start = addDaysISO(firstDay, k * BLOCK_DAYS);
    const end = addDaysISO(start, BLOCK_DAYS - 1);
    if (end > cutoff) break;
    if (k === 0) blocks.push({ start, end, confirmedBy: 'start' });
    else if (confirmedWell(start, end)) blocks.push({ start, end, confirmedBy: 'questionnaire' });
  }
  const kept = blocks.slice(-MAX_REFERENCE_BLOCKS);
  const days = kept.flatMap((b) => Array.from({ length: BLOCK_DAYS }, (_, i) => addDaysISO(b.start, i)));
  return { firstDay, daysOfData, phase: phaseFor(daysOfData), blocks: kept, days, personalShare: Math.min(1, daysOfData / AVERAGES_READY_DAYS) };
}

export interface Stats {
  mean: number;
  sd: number;
  n: number;
}

export interface ReferenceStats {
  pooled: Stats;
  weekday?: Stats;
  weekend?: Stats;
}

/** Saturday and Sunday. */
export function isWeekend(date: ISODate): boolean {
  const day = new Date(`${date}T12:00:00`).getDay();
  return day === 0 || day === 6;
}

function stats(values: number[]): Stats {
  const mean = average(values) as number;
  const sd = Math.sqrt(average(values.map((v) => (v - mean) ** 2)) as number);
  return { mean, sd, n: values.length };
}

/** One signal over the reference days, pooled and split by weekday / weekend. null = not enough yet. */
export function referenceStats(get: (date: ISODate) => number | undefined, reference: WellReference): ReferenceStats | null {
  const points = reference.days.map((date) => ({ date, value: get(date) })).filter((p): p is { date: ISODate; value: number } => p.value !== undefined);
  if (points.length < MIN_REFERENCE_VALUES) return null;
  const weekday = points.filter((p) => !isWeekend(p.date)).map((p) => p.value);
  const weekend = points.filter((p) => isWeekend(p.date)).map((p) => p.value);
  return {
    pooled: stats(points.map((p) => p.value)),
    weekday: weekday.length >= MIN_DAY_TYPE_VALUES ? stats(weekday) : undefined,
    weekend: weekend.length >= MIN_DAY_TYPE_VALUES ? stats(weekend) : undefined,
  };
}

/** The reference a given day is compared with: its own kind of day when there is enough of it. */
export function statsForDay(date: ISODate, reference: ReferenceStats): Stats {
  return (isWeekend(date) ? reference.weekend : reference.weekday) ?? reference.pooled;
}

/**
 * Phase 1 picture: until there are two weeks of the person's own data, the starting average is
 * a blend that moves from a population value to the person's own.
 */
export function blendWithPrior(personal: number | undefined, populationPrior: number, personalShare: number): number {
  if (personal === undefined) return populationPrior;
  return personal * personalShare + populationPrior * (1 - personalShare);
}

/** Population starting values (illustrative; used only as the phase-1 prior and for display). */
export const POPULATION_PRIOR = { steps: 7000, activityMinutes: 30, homeMinutes: 960, sleepMinutes: 450 } as const;
