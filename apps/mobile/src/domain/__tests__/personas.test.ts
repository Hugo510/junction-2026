import example from '../../../assets/personas/example/core.json';
import { parsePersona, rebasePersona } from '../../data/personas';
import { priorityScore } from '../priorityScore';

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
