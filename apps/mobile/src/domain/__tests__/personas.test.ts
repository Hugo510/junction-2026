import example from '../../data/personas/core.example.json';
import { parsePersona } from '../../data/personas';
import { priorityScore } from '../priorityScore';

describe('persona files (core.json)', () => {
  it('the example matches the schema the app expects', () => {
    const p = parsePersona(example);
    expect(p.persona.id).toBe('aino');
    expect(p.checkIns.length).toBeGreaterThan(0);
    // usable as-is by the domain
    expect(() => priorityScore({ checkIns: p.checkIns, sensors: p.sensors, today: '2026-11-14' })).not.toThrow();
  });

  it('rejects malformed files', () => {
    expect(() => parsePersona({})).toThrow();
    expect(() => parsePersona({ persona: { id: 'x', displayName: 'X' }, checkIns: [{ id: 'a', date: '13-11-2026', mood: 9, safetyConcern: false }], sensors: [], feedback: [] })).toThrow();
  });
});
