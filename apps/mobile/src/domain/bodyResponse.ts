import { addDaysISO, type ISODate } from './dates';
import type { InterventionFeedback, InterventionId, SensorAggregate } from './entities';
import { average, sensorsByDate } from './history';

/**
 * "Measure the response" step of the body loop (docs/MEMO_BODY_LOOP.md, B4).
 *
 * For one small step, how did the person's night-time recovery (night heart rate variability)
 * look on the nights after doing it, compared with their OWN previous 14 nights?
 *
 * Honest limits: this only describes what followed the step for this person. It is not evidence
 * that the step caused it, and it says nothing about depression. Effects are illustrative.
 */
export const BODY_BASELINE_NIGHTS = 14;
export const MIN_BASELINE_NIGHTS = 5;
export const MIN_RESPONSE_NIGHTS = 2;
/** Mean response (in the person's own standard deviations) needed to say "higher than your usual". */
export const BODY_RESPONSE_THRESHOLD = 0.3;

export interface BodyResponse {
  /** Mean next-night recovery vs own baseline, in standard deviations, capped at ±2 per night. */
  z: number;
  nights: number;
}

/**
 * One night: recovery on the night after `day`, in the person's own standard deviations from
 * their previous 14 nights, capped at ±2. undefined when the night or the baseline is missing.
 */
export function nightResponse(day: ISODate, byDate: Map<ISODate, SensorAggregate>): number | undefined {
  // Night values sit on the date of the evening the night starts: the night after the step.
  const night = byDate.get(day)?.nightHrvMs;
  if (night === undefined) return undefined;
  const baseline: number[] = [];
  for (let i = 1; i <= BODY_BASELINE_NIGHTS; i++) {
    const v = byDate.get(addDaysISO(day, -i))?.nightHrvMs;
    if (v !== undefined) baseline.push(v);
  }
  if (baseline.length < MIN_BASELINE_NIGHTS) return undefined;
  const mean = average(baseline) as number;
  const sd = Math.max(1, Math.sqrt((average(baseline.map((v) => (v - mean) ** 2)) as number) || 0));
  return Math.max(-2, Math.min(2, (night - mean) / sd));
}

export function bodyResponse(id: InterventionId, feedback: InterventionFeedback[], sensors: SensorAggregate[]): BodyResponse | null {
  const byDate = sensorsByDate(sensors);
  const days = new Set(feedback.filter((f) => f.interventionId === id).map((f) => f.date));
  const scores = [...days].map((day) => nightResponse(day, byDate)).filter((z): z is number => z !== undefined);
  if (scores.length < MIN_RESPONSE_NIGHTS) return null;
  return { z: average(scores) as number, nights: scores.length };
}

/** true when the nights after this step were clearly better than the person's own usual. */
export function respondsWell(response: BodyResponse | null): boolean {
  return !!response && response.z >= BODY_RESPONSE_THRESHOLD;
}
