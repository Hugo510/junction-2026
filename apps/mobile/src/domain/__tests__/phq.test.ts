import { addDaysISO } from '../dates';
import type { Phq9Entry } from '../entities';
import { hasPhqConcern, isPhqDue, latestPhq, phqBand, shouldContinueToPhq9 } from '../phq';

const TODAY = '2026-11-14';
const entry = (daysAgo: number, total: number, kind?: Phq9Entry['kind']): Phq9Entry => ({
  date: addDaysISO(TODAY, -daysAgo),
  items: [],
  total,
  kind,
});

describe('PHQ rules', () => {
  it('asks only when the priority is at least medium and not more than once a week', () => {
    expect(isPhqDue('low', [], TODAY)).toBe(false);
    expect(isPhqDue('medium', [], TODAY)).toBe(true);
    expect(isPhqDue('high', [entry(3, 2, 'phq2')], TODAY)).toBe(false);
    expect(isPhqDue('high', [entry(8, 2, 'phq2')], TODAY)).toBe(true);
  });

  it('only a recent FULL PHQ-9 of 10 or more counts as a concern', () => {
    expect(hasPhqConcern([entry(2, 12)], TODAY)).toBe(true);
    expect(hasPhqConcern([entry(2, 9)], TODAY)).toBe(false);
    expect(hasPhqConcern([entry(20, 14)], TODAY)).toBe(false);
    expect(hasPhqConcern([entry(1, 5, 'phq2')], TODAY)).toBe(false);
    // a newer low PHQ-9 clears an older high one
    expect(hasPhqConcern([entry(10, 13), entry(1, 4)], TODAY)).toBe(false);
  });

  it('PHQ-2 cutoff and bands', () => {
    expect(shouldContinueToPhq9([1, 1])).toBe(false);
    expect(shouldContinueToPhq9([2, 1])).toBe(true);
    expect([phqBand(4), phqBand(5), phqBand(9), phqBand(10)]).toEqual(['low', 'mid', 'mid', 'high']);
    expect(latestPhq([entry(5, 1), entry(1, 7)])?.total).toBe(7);
  });
});
