import { generateHistory } from '../../data/seed';
import type { CheckIn } from '../entities';
import { daysLogged, emotionCounts, entriesByDate, milestones, monthGrid } from '../journal';

const entry = (id: string, date: string, createdAt: string): CheckIn => ({
  id,
  date,
  createdAt,
  mood: 3,
  safetyConcern: false,
});

describe('journal', () => {
  it('counts distinct days and never penalises gaps', () => {
    const entries = [entry('a', '2026-11-01', '1'), entry('b', '2026-11-01', '2'), entry('c', '2026-11-10', '3')];
    expect(daysLogged(entries)).toBe(2);
    expect(milestones(entries).filter((m) => m.unlocked).map((m) => m.days)).toEqual([1]);
  });

  it('groups entries by day, newest first', () => {
    const map = entriesByDate([entry('a', '2026-11-01', '2026-11-01T08:00'), entry('b', '2026-11-01', '2026-11-01T20:00')]);
    expect(map.get('2026-11-01')?.map((e) => e.id)).toEqual(['b', 'a']);
  });

  it('counts feelings from the synthetic history', () => {
    const h = generateHistory('declining', '2026-11-13');
    const top = emotionCounts(h.checkIns, '2026-11-13');
    expect(top.length).toBeGreaterThan(0);
    expect(top[0].count).toBeGreaterThanOrEqual(top[top.length - 1].count);
  });

  it('builds a Monday-first month grid', () => {
    const weeks = monthGrid(2026, 10); // November 2026 starts on a Sunday
    expect(weeks[0]).toEqual([null, null, null, null, null, null, '2026-11-01']);
    expect(weeks.flat().filter(Boolean)).toHaveLength(30);
    weeks.forEach((w) => expect(w).toHaveLength(7));
  });
});
