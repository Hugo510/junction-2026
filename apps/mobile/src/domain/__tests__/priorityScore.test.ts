import { generateHistory } from '../../data/seed';
import { addDaysISO } from '../dates';
import type { CheckIn } from '../entities';
import { eveningMinutes, levelForScore, priorityScore, signalDrift } from '../priorityScore';

const TODAY = '2026-11-14';
const YESTERDAY = addDaysISO(TODAY, -1);

describe('priorityScore', () => {
  it('is low for a good synthetic week', () => {
    const h = generateHistory('good', YESTERDAY);
    const r = priorityScore({ checkIns: h.checkIns, sensors: h.sensors, today: TODAY });
    expect(r.level).toBe('low');
    expect(r.score).toBeLessThan(30);
  });

  it('rises for a declining synthetic week and explains why', () => {
    const good = generateHistory('good', YESTERDAY);
    const bad = generateHistory('declining', YESTERDAY);
    const goodScore = priorityScore({ checkIns: good.checkIns, sensors: good.sensors, today: TODAY });
    const badScore = priorityScore({ checkIns: bad.checkIns, sensors: bad.sensors, today: TODAY });

    expect(badScore.score).toBeGreaterThan(goodScore.score);
    expect(badScore.level).toBe('high');
    expect(badScore.reasons).toEqual(
      expect.arrayContaining(['priority.reasons.moodDrop', 'priority.reasons.shortSleep', 'priority.reasons.reactionSlower']),
    );
  });

  it('adds points for perceived urgency', () => {
    const h = generateHistory('good', YESTERDAY);
    const base = priorityScore({ checkIns: h.checkIns, sensors: h.sensors, today: TODAY });
    const high = priorityScore({ checkIns: h.checkIns, sensors: h.sensors, today: TODAY, perceivedUrgency: 'high' });
    expect(high.score - base.score).toBe(15);
    expect(high.reasons).toContain('priority.reasons.perceivedUrgency');
  });

  it('handles empty history without errors', () => {
    const r = priorityScore({ checkIns: [], sensors: [], today: TODAY });
    expect(r).toEqual({ score: 0, level: 'low', reasons: [] });
  });

  it('counts missed check-ins', () => {
    const one: CheckIn = {
      id: 'x',
      date: addDaysISO(TODAY, -6),
      createdAt: '2026-11-08T10:00:00.000Z',
      mood: 4,
      energy: 4,
      anxiety: 2,
      sleepHours: 7,
      safetyConcern: false,
    };
    const r = priorityScore({ checkIns: [one], sensors: [], today: TODAY });
    expect(r.reasons).toContain('priority.reasons.missedCheckIns');
    expect(r.score).toBe(15);
  });

  it('counts long sleep too (hypersomnia), not only short nights', () => {
    const days = [1, 2, 3, 4].map((i) => addDaysISO(TODAY, -i));
    const checkIns: CheckIn[] = days.map((date, i) => ({
      id: `s${i}`,
      date,
      createdAt: `${date}T20:00:00.000Z`,
      mood: 3,
      sleepHours: 11,
      safetyConcern: false,
    }));
    const r = priorityScore({ checkIns, sensors: [], today: TODAY });
    expect(r.reasons).toContain('priority.reasons.longSleep');
    expect(r.reasons).not.toContain('priority.reasons.shortSleep');
  });

  it('keeps the signal when someone stays low for weeks (personal baseline)', () => {
    // 40 days at mood 4, then 14 days at mood 2: week-over-week drop is 0, but they are still unwell.
    const checkIns: CheckIn[] = Array.from({ length: 54 }, (_, i) => {
      const date = addDaysISO(TODAY, -(53 - i));
      return { id: `b${i}`, date, createdAt: `${date}T20:00:00.000Z`, mood: i < 40 ? 4 : 2, safetyConcern: false };
    });
    const r = priorityScore({ checkIns, sensors: [], today: TODAY });
    expect(r.reasons).not.toContain('priority.reasons.moodDrop');
    expect(r.reasons).toContain('priority.reasons.belowBaseline');
    expect(r.score).toBeGreaterThanOrEqual(30 + 15); // baseline drop (max 30) + lowMood
  });

  it('does not double count week drop and baseline drop', () => {
    const checkIns: CheckIn[] = Array.from({ length: 40 }, (_, i) => {
      const date = addDaysISO(TODAY, -(39 - i));
      return { id: `d${i}`, date, createdAt: `${date}T20:00:00.000Z`, mood: i < 33 ? 4 : 2, safetyConcern: false };
    });
    const r = priorityScore({ checkIns, sensors: [], today: TODAY });
    expect(r.reasons).toEqual(expect.arrayContaining(['priority.reasons.moodDrop', 'priority.reasons.belowBaseline']));
    expect(r.score).toBe(30 + 15); // max(30, 30) + lowMood, not 75
  });

  describe('phone-sensed signals vs the own baseline', () => {
    const sensors = (recentHome: number, recentOff: string) =>
      Array.from({ length: 60 }, (_, i) => ({
        date: addDaysISO(TODAY, -i),
        activityMinutes: 40,
        daylightMinutes: 40,
        homeMinutes: i < 7 ? recentHome : 900,
        screenOffTime: i < 7 ? recentOff : '23:00',
      }));

    it('compares evening times across midnight', () => {
      expect(eveningMinutes('00:30')).toBeGreaterThan(eveningMinutes('23:30'));
      expect(eveningMinutes('01:00') - eveningMinutes('23:00')).toBe(120);
    });

    it('adds points and reasons for more time at home and later nights', () => {
      const r = priorityScore({ checkIns: [], sensors: sensors(1200, '00:40'), today: TODAY });
      expect(signalDrift({ sensors: sensors(1200, '00:40'), today: TODAY })).toEqual({ homeDeltaPct: 33, screenOffDeltaMin: 100 });
      expect(r.reasons).toEqual(['priority.reasons.homeMore', 'priority.reasons.laterNights']);
      expect(r.score).toBe(20);
    });

    it('stays quiet inside the own range and without enough data', () => {
      expect(priorityScore({ checkIns: [], sensors: sensors(950, '23:20'), today: TODAY }).score).toBe(0);
      const short = sensors(1300, '01:30').slice(0, 10); // no baseline yet
      expect(priorityScore({ checkIns: [], sensors: short, today: TODAY }).score).toBe(0);
    });
  });

  it('maps scores to levels', () => {
    expect(levelForScore(0)).toBe('low');
    expect(levelForScore(30)).toBe('medium');
    expect(levelForScore(60)).toBe('high');
  });
});
