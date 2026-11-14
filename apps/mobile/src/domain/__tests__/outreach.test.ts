import { addDaysISO } from '../dates';
import { EMBER_FLOOR, emberLevel, emberState } from '../embers';
import type { CheckIn, SensorAggregate } from '../entities';
import { daysSilent, outreachLevel, shouldNotifyCareTeam } from '../outreach';
import { priorityScore } from '../priorityScore';

const TODAY = '2026-11-14';
const entry = (daysAgo: number, extra: Partial<CheckIn> = {}): CheckIn => {
  const date = addDaysISO(TODAY, -daysAgo);
  return { id: `c${daysAgo}`, date, createdAt: `${date}T20:00:00.000Z`, mood: 3, safetyConcern: false, ...extra };
};

describe('silence rule (outreach ladder)', () => {
  it('climbs warm → friend → reconnect with the days of silence', () => {
    expect(outreachLevel([entry(1)], TODAY)).toBe('none');
    expect(outreachLevel([entry(2)], TODAY)).toBe('warm');
    expect(outreachLevel([entry(5)], TODAY)).toBe('friend');
    expect(outreachLevel([entry(9)], TODAY)).toBe('reconnect');
  });

  it('a new user is not "silent"', () => {
    expect(daysSilent([], TODAY)).toBeNull();
    expect(outreachLevel([], TODAY)).toBe('none');
  });

  it('tells the care team only with consent, only at day 7+, and not twice in a week', () => {
    expect(shouldNotifyCareTeam('reconnect', false, [], TODAY)).toBe(false);
    expect(shouldNotifyCareTeam('friend', true, [], TODAY)).toBe(false);
    expect(shouldNotifyCareTeam('reconnect', true, [], TODAY)).toBe(true);
    const recent = [{ source: 'silence' as const, createdAt: `${addDaysISO(TODAY, -3)}T10:00:00.000Z` }];
    expect(shouldNotifyCareTeam('reconnect', true, recent, TODAY)).toBe(false);
  });
});

describe('embers (self-care, never out)', () => {
  const sensors = (active: boolean): SensorAggregate[] =>
    Array.from({ length: 14 }, (_, i) => ({
      date: addDaysISO(TODAY, -i),
      activityMinutes: active ? 30 : 0,
      daylightMinutes: active ? 30 : 0,
    }));

  it('never goes below the floor, even with no self-care at all', () => {
    const level = emberLevel([], sensors(false), [], TODAY);
    expect(level).toBeGreaterThanOrEqual(EMBER_FLOOR);
    expect(emberState(level)).toBe('low');
  });

  it('glows brighter with self-care', () => {
    const care = Array.from({ length: 14 }, (_, i) => entry(i));
    const level = emberLevel(care, sensors(true), [], TODAY);
    expect(level).toBeGreaterThan(0.7);
    expect(emberState(level)).toBe('bright');
  });

  it('changes slowly: one missed day barely moves it', () => {
    const care = Array.from({ length: 14 }, (_, i) => entry(i + 1));
    const yesterday = emberLevel(care, sensors(true), [], addDaysISO(TODAY, -1));
    const today = emberLevel(care, sensors(true).filter((s) => s.date !== TODAY), [], TODAY);
    expect(Math.abs(yesterday - today)).toBeLessThan(0.2);
  });
});

describe('upwardDrift (clinic bipolar flag)', () => {
  const drifting = Array.from({ length: 14 }, (_, i) =>
    i < 7 ? entry(i, { sleepHours: 4.5, energy: 5, mood: 5 }) : entry(i, { sleepHours: 7.5, energy: 3, mood: 3 }),
  );

  it('flags short sleep + higher energy only when the clinic set the flag', () => {
    const flagged = priorityScore({ checkIns: drifting, sensors: [], today: TODAY, flags: { bipolar: true } });
    const notFlagged = priorityScore({ checkIns: drifting, sensors: [], today: TODAY });
    expect(flagged.reasons).toContain('priority.reasons.upwardDrift');
    expect(notFlagged.reasons).not.toContain('priority.reasons.upwardDrift');
    expect(flagged.score - notFlagged.score).toBe(25);
  });

  it('does not fire on good sleep', () => {
    const rested = drifting.map((c) => ({ ...c, sleepHours: 8 }));
    const r = priorityScore({ checkIns: rested, sensors: [], today: TODAY, flags: { bipolar: true } });
    expect(r.reasons).not.toContain('priority.reasons.upwardDrift');
  });
});
