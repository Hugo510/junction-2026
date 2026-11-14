import { generateHistory } from '../../data/seed';
import { addDaysISO, daysBetween, lastNDates } from '../dates';
import { DEFAULT_LATITUDE, daylightHours, distanceMeters } from '../daylight';
import { weeklyMoodTrend } from '../history';
import { summarizeReaction } from '../reaction';

describe('seed', () => {
  it('is deterministic and synthetic', () => {
    const a = generateHistory('declining', '2026-11-13');
    const b = generateHistory('declining', '2026-11-13');
    expect(a).toEqual(b);
    expect(a.sensors).toHaveLength(14);
    expect(a.checkIns.length).toBe(12); // two missed days
    expect(a.checkIns.every((c) => c.id.startsWith('seed-'))).toBe(true);
  });
});

describe('dates', () => {
  it('works across month boundaries', () => {
    expect(addDaysISO('2026-11-01', -1)).toBe('2026-10-31');
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2);
    expect(lastNDates('2026-11-02', 3)).toEqual(['2026-10-31', '2026-11-01', '2026-11-02']);
  });
});

describe('weeklyMoodTrend', () => {
  it('detects a harder week', () => {
    const h = generateHistory('declining', '2026-11-13');
    expect(weeklyMoodTrend(h.checkIns, '2026-11-13').trend).toBe('harder');
  });
  it('needs some data', () => {
    expect(weeklyMoodTrend([], '2026-11-13').trend).toBe('notEnough');
  });
});

describe('reaction', () => {
  it('keeps only the aggregate', () => {
    const r = summarizeReaction([300, 340, 320], 4);
    expect(r).toEqual({ meanMs: 320, sdMs: 20, accuracy: 0.75, rounds: 4 });
  });
});

describe('daylight', () => {
  it('is short in Helsinki in November and long in June', () => {
    const nov = daylightHours(DEFAULT_LATITUDE, new Date(2026, 10, 14));
    const jun = daylightHours(DEFAULT_LATITUDE, new Date(2026, 5, 21));
    expect(nov).toBeGreaterThan(6);
    expect(nov).toBeLessThan(8);
    expect(jun).toBeGreaterThan(18);
  });
  it('measures distances', () => {
    expect(Math.round(distanceMeters({ lat: 60, lon: 24 }, { lat: 60.001, lon: 24 }))).toBe(111);
  });
});
