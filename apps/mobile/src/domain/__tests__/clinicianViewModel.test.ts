import { PERSONAS } from '../../data/personas';
import { buildClinicianRows, callStatus } from '../../features/clinician/clinicianViewModel';
import type { Phq9Entry } from '../entities';
const TODAY = '2026-11-15';
const q = (date: string, total: number, kind: Phq9Entry['kind'] = 'phq9'): Phq9Entry => ({ date, total, kind, items: Array(9).fill(0) });

describe('clinician projection', () => {
  it('calculates all five fixture priorities, sorted, without changing input', () => {
    const before = JSON.stringify(PERSONAS);
    const rows = buildClinicianRows(PERSONAS, TODAY);
    expect(rows.map((r) => [r.id, r.priority.score, r.priority.level])).toEqual([
      ['aino', 90, 'high'], ['sara', 35, 'medium'], ['elias', 0, 'low'], ['juho', 0, 'low'], ['leena', 0, 'low'],
    ]);
    expect(rows.filter((r) => r.lostContact).map((r) => r.id)).toEqual(['sara']);
    expect(rows.map((r) => [r.id, r.latestPhq9?.total, r.latestPhq9?.date])).toEqual([
      ['aino', 12, '2026-11-14'], ['sara', 5, '2026-09-28'],
      ['elias', 4, '2026-11-09'], ['juho', 4, '2026-11-09'], ['leena', 2, '2026-11-09'],
    ]);
    expect(rows.filter((r) => r.callStatus === 'review')).toEqual([]);
    expect(rows.every((r) => !r.safetyRecorded)).toBe(true);
    expect(rows[0].callStatus).toBe('pending');
    expect(JSON.stringify(PERSONAS)).toBe(before);
    expect(rows.every((r) => r.reasons.length <= 2)).toBe(true);
  });
  it('keeps contact lost when outreach becomes quiet, without creating clinical alerts', () => {
    const persona = { ...PERSONAS[0], checkIns: [{ ...PERSONAS[0].checkIns[0], date: '2026-10-16', safetyConcern: false }], sensors: [], phq9: [] };
    const [row] = buildClinicianRows([persona], TODAY);
    expect(row.outreach).toBe('quiet');
    expect(row.lostContact).toBe(true);
    expect(row.callStatus).toBe('pending');
    expect(row.safetyRecorded).toBe(false);
  });
  it('does not import or write active patient state', () => {
    const fs = require('fs') as { readFileSync(path: string, encoding: string): string };
    const source = fs.readFileSync('src/features/clinician/clinicianViewModel.ts', 'utf8');
    expect(source).not.toMatch(/from ['"].*(?:store|repositories)/);
    const hook = fs.readFileSync('src/features/clinician/useClinicianViewModel.ts', 'utf8');
    expect(hook).not.toMatch(/useData|loadPersona|setState|repositories/);
  });
  it('never equates sensor priority or a single PHQ concern with the call list', () => {
    expect(callStatus([], TODAY)).toBe('pending');
    expect(callStatus([q(TODAY, 12)], TODAY)).toBe('pending');
    expect(callStatus([q(TODAY, 15)], TODAY)).toBe('review');
    expect(callStatus([q(TODAY, 6, 'phq2')], TODAY)).toBe('pending');
    expect(callStatus([q('2026-11-16', 20)], TODAY)).toBe('pending');
    expect(callStatus([q(TODAY, 9)], TODAY)).toBe('notIndicated');
  });
  it('requires both elevations and a documented baseline, seven to fourteen days apart', () => {
    expect(callStatus([q('2026-11-08', 11), q(TODAY, 12)], TODAY, 6)).toBe('review');
    expect(callStatus([q('2026-11-08', 10), q(TODAY, 12)], TODAY, 6)).toBe('pending');
    expect(callStatus([q('2026-11-09', 11), q(TODAY, 12)], TODAY, 6)).toBe('pending');
    expect(callStatus([q('2026-10-31', 11), q(TODAY, 12)], TODAY, 6)).toBe('pending');
    expect(callStatus([q(TODAY, 12)], TODAY, 8)).toBe('notIndicated');
  });
  it('keeps rule ordering and excludes future PHQ results', () => {
    const rows = buildClinicianRows(PERSONAS, TODAY);
    expect(rows[0].reasons).toEqual(rows[0].priority.reasons.slice(0, 2));
    const persona = { ...PERSONAS[0], phq9: [q('2026-11-16', 20), q(TODAY, 3)] };
    expect(buildClinicianRows([persona], TODAY)[0].latestPhq9?.total).toBe(3);
  });
});
