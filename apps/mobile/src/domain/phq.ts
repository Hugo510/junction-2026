import { daysBetween, type ISODate } from './dates';
import type { Phq9Entry, PriorityLevel } from './entities';

/**
 * PHQ-2 → PHQ-9 ("sensors only ask, questionnaires decide, humans confirm").
 *
 * - When the priority reaches medium, Hiillos reaches out and asks the 2 PHQ-2 questions.
 * - PHQ-2 ≥ 3 → continue with the remaining 7 items (full PHQ-9).
 * - Item 9 > 0 is handled by the fixed safety rule (crisis screen + urgent alert).
 * - A consultation is only SUGGESTED after a recent PHQ-9 total ≥ 10; signals alone never do it.
 *
 * Scores are shown to nobody as a diagnosis; the patient sees a kind reply, the clinician a number.
 */
export const PHQ2_CUTOFF = 3;
/** Don't ask again within this many days. */
export const PHQ_REPEAT_DAYS = 7;
export const PHQ_CONCERN_TOTAL = 10;
export const PHQ_CONCERN_WINDOW_DAYS = 14;

export type PhqAnswer = 0 | 1 | 2 | 3;
export type PhqBand = 'low' | 'mid' | 'high';

export const phqTotal = (items: number[]): number => items.reduce((a, b) => a + b, 0);

export function phqBand(total: number): PhqBand {
  if (total >= PHQ_CONCERN_TOTAL) return 'high';
  if (total >= 5) return 'mid';
  return 'low';
}

export const isFullPhq9 = (e: Phq9Entry): boolean => (e.kind ?? 'phq9') === 'phq9';

export function latestPhq(entries: Phq9Entry[], onlyFull = false): Phq9Entry | undefined {
  return entries
    .filter((e) => !onlyFull || isFullPhq9(e))
    .reduce<Phq9Entry | undefined>((max, e) => (!max || e.date >= max.date ? e : max), undefined);
}

/** Reach out with the two questions: priority at least medium and no questionnaire in the last week. */
export function isPhqDue(level: PriorityLevel, entries: Phq9Entry[], today: ISODate): boolean {
  if (level === 'low') return false;
  const last = latestPhq(entries);
  return !last || daysBetween(last.date, today) >= PHQ_REPEAT_DAYS;
}

/** A recent full PHQ-9 at or above the threshold: the companion may suggest talking to the care team. */
export function hasPhqConcern(entries: Phq9Entry[], today: ISODate): boolean {
  const last = latestPhq(entries, true);
  return !!last && daysBetween(last.date, today) <= PHQ_CONCERN_WINDOW_DAYS && last.total >= PHQ_CONCERN_TOTAL;
}

/** After the first two answers: stop (PHQ-2 below cutoff) or continue to the full PHQ-9? */
export function shouldContinueToPhq9(firstTwo: number[]): boolean {
  return phqTotal(firstTwo.slice(0, 2)) >= PHQ2_CUTOFF;
}
