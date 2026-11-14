import example from '../../../assets/personas/example/core.json';
import { parsePersona, PERSONAS, rebasePersona } from '../../data/personas';
import { EMBER_FLOOR, emberLevel, emberState } from '../embers';
import { INTERVENTION_IDS } from '../interventions';
import { rankInterventions } from '../interventionPicker';
import { outreachLevel } from '../outreach';
import { hasPhqConcern } from '../phq';
import { priorityScore } from '../priorityScore';

/** Expected state on the demo day (the day after each file ends), from tools/synthetic/ABOUT.md. */
describe('the five demo personas on demo day', () => {
  const DEMO_DAY = '2026-11-15';
  const byId = (id: string) => {
    const p = PERSONAS.find((x) => x.persona.id === id);
    if (!p) throw new Error(`persona ${id} is not registered`);
    return p;
  };
  const priority = (id: string) => {
    const p = byId(id);
    return priorityScore({ checkIns: p.checkIns, sensors: p.sensors, today: DEMO_DAY });
  };

  it('all five are registered, synthetic and valid', () => {
    expect(PERSONAS.map((p) => p.persona.id)).toEqual(['aino', 'leena', 'juho', 'sara', 'elias']);
    expect(PERSONAS.every((p) => p.synthetic === true)).toBe(true);
    expect(PERSONAS.every((p) => (p.phq9 ?? []).every((q) => q.items[8] === 0))).toBe(true); // item 9 is 0 in demo data
  });

  it('Aino: drift caught, high priority, and two PHQ-9 of 10 or more', () => {
    const r = priority('aino');
    expect(r).toMatchObject({ score: 70, level: 'high' });
    expect(r.reasons).toEqual(expect.arrayContaining(['priority.reasons.belowBaseline', 'priority.reasons.longSleep']));
    expect(hasPhqConcern(byId('aino').phq9 ?? [], DEMO_DAY)).toBe(true);
    expect(byId('aino').phq9?.slice(-2).map((q) => q.total)).toEqual([11, 12]);
  });

  it('Leena, Juho and Elias are quiet on demo day (no alerts)', () => {
    for (const id of ['leena', 'juho', 'elias']) {
      expect(priority(id)).toMatchObject({ score: 0, level: 'low' });
      expect(hasPhqConcern(byId(id).phq9 ?? [], DEMO_DAY)).toBe(false);
      expect(outreachLevel(byId(id).checkIns, DEMO_DAY)).toBe('none');
    }
  });

  it('Sara: lost contact (silence ladder), low priority, embers at the floor but not out', () => {
    const sara = byId('sara');
    expect(priority('sara')).toMatchObject({ score: 15, level: 'low' });
    expect(outreachLevel(sara.checkIns, DEMO_DAY)).toBe('reconnect');
    const level = emberLevel(sara.checkIns, sara.sensors, sara.feedback, DEMO_DAY);
    expect(level).toBeGreaterThanOrEqual(EMBER_FLOOR);
    expect(emberState(level)).toBe('low');
  });

  it('the learning differs per person: walks for Aino, fireplace for Juho', () => {
    const top = (id: string) => rankInterventions(INTERVENTION_IDS, byId(id).feedback, byId(id).checkIns)[0].id;
    expect(top('aino')).toBe('daylightWalk');
    expect(top('juho')).toBe('fireplace');
  });

  it('Elias: the flu week reached medium (two questions) but never high, and his PHQ-9 stayed under 10', () => {
    const elias = byId('elias');
    const flu = priorityScore({ checkIns: elias.checkIns, sensors: elias.sensors, today: '2026-11-04' });
    expect(flu.level).toBe('medium');
    expect(Math.max(...(elias.phq9 ?? []).map((q) => q.total))).toBeLessThan(10);
  });
});

describe('persona files (core.json)', () => {
  it('the example matches the format the app expects', () => {
    const p = parsePersona(example);
    expect(p.persona.id).toBe('aino');
    expect(p.persona.label).toBe('Aino, 42, post-TMS');
    expect(p.sensors[0]).toMatchObject({ homeMinutes: 820, bedtime: '23:10', steps: 6400, nightPhoneMinutes: 12 });
    expect(p.phq9?.[0].total).toBe(3);
    // usable as-is by the domain
    expect(() => priorityScore({ checkIns: p.checkIns, sensors: p.sensors, today: '2026-11-14' })).not.toThrow();
  });

  it('refuses files that are not marked synthetic', () => {
    expect(() => parsePersona({ ...example, synthetic: false })).toThrow(/synthetic/);
  });

  it('rejects malformed files', () => {
    expect(() => parsePersona({})).toThrow();
    const base = { synthetic: true, persona: { id: 'x', label: 'X' }, sensors: [], feedback: [] };
    expect(() => parsePersona({ ...base, checkIns: [{ id: 'a', date: '13-11-2026', mood: 9, safetyConcern: false }] })).toThrow();
    expect(() => parsePersona({ ...base, checkIns: [], phq9: [{ date: '2026-11-11', items: [0, 1, 0, 1, 0, 0, 1, 0, 0], total: 9 }] })).toThrow(/PHQ-9/);
    expect(() => parsePersona({ ...base, checkIns: [], sensors: [{ date: '2026-11-11', activityMinutes: 1, daylightMinutes: 1, bedtime: '25:00' }] })).toThrow(/bedtime/);
  });

  it('moves all dates so the file ends on the requested day (keeps gaps)', () => {
    const p = parsePersona(example);
    const moved = rebasePersona(p, '2026-12-24');
    expect(moved.sensors.map((s) => s.date)).toEqual(['2026-12-22', '2026-12-23', '2026-12-24']);
    expect(moved.checkIns.map((c) => c.date)).toEqual(['2026-12-22', '2026-12-24']); // silent day stays silent
    expect(moved.checkIns[1].createdAt.slice(0, 10)).toBe('2026-12-24');
    expect(moved.phq9?.[0].date).toBe('2026-12-22');
    expect(moved.feedback[0].date).toBe('2026-12-22');
    expect(rebasePersona(p, '2026-11-13')).toBe(p); // already aligned
  });
});
