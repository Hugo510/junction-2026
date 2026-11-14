import { PERSONAS, rebasePersona } from '../../data/personas';
import { bodyResponse, respondsWell } from '../bodyResponse';
import { addDaysISO } from '../dates';
import type { CheckIn, InterventionFeedback, SensorAggregate } from '../entities';
import { INTERVENTION_IDS } from '../interventions';
import { BODY_WEIGHT, rankInterventions, rewardFor } from '../interventionPicker';
import { priorityScore } from '../priorityScore';
import { mergeWearable, simulateWearable, simulateWearableDay, wearableSummary } from '../wearable';

const TODAY = '2026-11-15';
const LAST_NIGHT = addDaysISO(TODAY, -1);

const sensor = (date: string, extra: Partial<SensorAggregate> = {}): SensorAggregate => ({ date, activityMinutes: 30, daylightMinutes: 30, ...extra });
const checkIn = (date: string, extra: Partial<CheckIn> = {}): CheckIn => ({ id: `c-${date}`, date, createdAt: `${date}T08:00:00.000Z`, mood: 4, safetyConcern: false, ...extra });

describe('wearable daily totals', () => {
  it('is deterministic: the same day always gives the same totals', () => {
    expect(simulateWearableDay(TODAY)).toEqual(simulateWearableDay(TODAY));
    expect(simulateWearableDay(TODAY)).not.toEqual(simulateWearableDay(LAST_NIGHT));
  });

  it('stays inside plausible ranges', () => {
    for (const d of simulateWearable({ checkIns: [], sensors: [], today: TODAY, days: 90 })) {
      expect(d.sleepMinutes).toBeGreaterThanOrEqual(240);
      expect(d.sleepMinutes).toBeLessThanOrEqual(588);
      expect(d.steps).toBeGreaterThanOrEqual(300);
      expect(d.restingHr).toBeGreaterThanOrEqual(48);
      expect(d.restingHr).toBeLessThanOrEqual(88);
      expect(d.nightHrvMs).toBeGreaterThanOrEqual(15);
      expect(d.nightHrvMs).toBeLessThanOrEqual(110);
    }
  });

  it('values from the persona file always win over the simulation', () => {
    const row = sensor(TODAY, { sleepMinutes: 401, restingHr: 71, nightHrvMs: 33, steps: 4321 });
    expect(simulateWearableDay(TODAY, undefined, row)).toEqual({ date: TODAY, sleepMinutes: 401, restingHr: 71, nightHrvMs: 33, steps: 4321 });
  });

  it('follows the person’s own data: reported sleep, later evenings, less movement', () => {
    expect(Math.abs(simulateWearableDay(TODAY, checkIn(addDaysISO(TODAY, 1), { sleepHours: 5 })).sleepMinutes - 300)).toBeLessThanOrEqual(18);
    const early = simulateWearableDay(TODAY, undefined, sensor(TODAY, { screenOffTime: '22:30' }));
    const late = simulateWearableDay(TODAY, undefined, sensor(TODAY, { screenOffTime: '01:30' }));
    expect(late.sleepMinutes).toBeLessThan(early.sleepMinutes);
    const active = simulateWearableDay(TODAY, undefined, sensor(TODAY, { activityMinutes: 60 }));
    const still = simulateWearableDay(TODAY, undefined, sensor(TODAY, { activityMinutes: 5 }));
    expect(still.steps).toBeLessThan(active.steps);
  });

  it('covers the last N nights, oldest first, ending with last night', () => {
    const days = simulateWearable({ checkIns: [], sensors: [], today: TODAY, days: 7 });
    expect(days.map((d) => d.date)).toEqual([-7, -6, -5, -4, -3, -2, -1].map((i) => addDaysISO(TODAY, i)));
  });

  it('only enriches days the phone already has and never overwrites what the row carries', () => {
    const days = simulateWearable({ checkIns: [], sensors: [], today: TODAY, days: 3 });
    const merged = mergeWearable([sensor(LAST_NIGHT, { steps: 999, nightHrvMs: 77 }), sensor('2026-01-01')], days);
    expect(merged).toHaveLength(2);
    expect(merged[0].steps).toBe(999);
    expect(merged[0].nightHrvMs).toBe(77);
    expect(merged[0].sleepMinutes).toBe(days[2].sleepMinutes);
    expect(merged[1]).toEqual(sensor('2026-01-01'));
  });

  it('summarises the week against the person’s own usual', () => {
    const days = simulateWearable({ checkIns: [], sensors: [], today: TODAY });
    const summary = wearableSummary(days, TODAY);
    expect(summary.sleep.week).toHaveLength(7);
    expect(summary.sleep.latest).toBeCloseTo(days[days.length - 1].sleepMinutes / 60, 1);
    expect(summary.steps.latest).toBe(days[days.length - 1].steps);
    expect(summary.recovery.latest).toBe(days[days.length - 1].nightHrvMs);
    expect(summary.heart.usual).toBeGreaterThan(48);
    expect(wearableSummary([], TODAY).sleep).toEqual({ latest: undefined, week: [], usual: undefined });
  });
});

describe('wearable sleep in the priority score', () => {
  // A check-in on day D reports the night that started on D-1, so that is the row the rule reads.
  const nights = (minutes: (i: number) => number) => Array.from({ length: 8 }, (_, i) => sensor(addDaysISO(TODAY, -i), { sleepMinutes: minutes(i) }));
  const checkIns = Array.from({ length: 7 }, (_, i) => checkIn(addDaysISO(TODAY, -i)));

  it('fills in nights the person did not log, with the same rule and the same weight', () => {
    const sensors = nights((i) => (i >= 1 && i <= 3 ? 250 : 450));
    const withWearable = priorityScore({ checkIns, sensors, today: TODAY });
    expect(withWearable.reasons).toContain('priority.reasons.shortSleep');
    expect(withWearable.score).toBe(15);
    const without = priorityScore({ checkIns, sensors: sensors.map(({ sleepMinutes: _s, ...rest }) => rest), today: TODAY });
    expect(without.reasons).not.toContain('priority.reasons.shortSleep');
  });

  it('what the person reported wins over the measured value', () => {
    const reported = checkIns.map((c) => ({ ...c, sleepHours: 7.5 }));
    expect(priorityScore({ checkIns: reported, sensors: nights(() => 250), today: TODAY }).reasons).not.toContain('priority.reasons.shortSleep');
  });

  it('connecting a wearable does not move any of the five personas to another level on demo day', () => {
    for (const persona of PERSONAS) {
      const data = rebasePersona(persona, LAST_NIGHT);
      const flags = { bipolar: persona.persona.bipolarFlag };
      const plain = priorityScore({ checkIns: data.checkIns, sensors: data.sensors, today: TODAY, flags });
      const sensors = mergeWearable(data.sensors, simulateWearable({ checkIns: data.checkIns, sensors: data.sensors, today: TODAY }));
      const connected = priorityScore({ checkIns: data.checkIns, sensors, today: TODAY, flags });
      expect({ id: persona.persona.id, level: connected.level }).toEqual({ id: persona.persona.id, level: plain.level });
    }
  });
});

describe('the body’s answer in the learning score (B3)', () => {
  const walk = (date: string, rating: 1 | 0 | -1 = 0): InterventionFeedback => ({ id: `w-${date}`, interventionId: 'daylightWalk', date, rating });
  const calm = (date: string, rating: 1 | 0 | -1 = 0): InterventionFeedback => ({ id: `b-${date}`, interventionId: 'breathing', date, rating });
  const D2 = addDaysISO(TODAY, -2);
  const D6 = addDaysISO(TODAY, -6);
  /** 30 nights at 39–41 ms, with the nights after the walks clearly better. */
  const rows = Array.from({ length: 30 }, (_, i) => sensor(addDaysISO(TODAY, -i), { nightHrvMs: i === 2 || i === 6 ? 48 : 40 + (i % 3) - 1 }));

  it('adds up to ±0.5 for a night clearly better or worse than the person’s own usual', () => {
    expect(rewardFor(walk(D2, 1), [], rows)).toBeCloseTo(1 + BODY_WEIGHT * 2, 5);
    const worse = rows.map((r) => (r.date === D2 ? { ...r, nightHrvMs: 30 } : r));
    expect(rewardFor(walk(D2, 1), [], worse)).toBeCloseTo(1 - BODY_WEIGHT * 2, 5);
  });

  it('changes nothing without wearable nights or without a baseline', () => {
    expect(rewardFor(walk(D2, 1), [])).toBe(1);
    expect(rewardFor(walk(D2, 1), [], [sensor(D2)])).toBe(1);
    expect(rewardFor(walk(D2, 1), [], [sensor(D2, { nightHrvMs: 60 })])).toBe(1);
  });

  it('lets the body break a tie: same thumbs, but nights were better after the walks', () => {
    const feedback = [walk(D2), walk(D6), calm(addDaysISO(TODAY, -3)), calm(addDaysISO(TODAY, -8))];
    const ids = ['breathing', 'daylightWalk'] as const;
    expect(rankInterventions(ids, feedback, [])[0].id).toBe('breathing');
    expect(rankInterventions(ids, feedback, [], {}, rows)[0].id).toBe('daylightWalk');
  });

  it('with today’s persona files (no watch data yet) every persona keeps the same ranking', () => {
    for (const persona of PERSONAS) {
      const data = rebasePersona(persona, LAST_NIGHT);
      const order = (s?: SensorAggregate[]) => rankInterventions(INTERVENTION_IDS, data.feedback, data.checkIns, {}, s).map((r) => r.id);
      if (data.sensors.every((s) => s.nightHrvMs === undefined)) expect(order(data.sensors)).toEqual(order());
    }
  });
});

describe('body response to a small step (B4)', () => {
  const fb = (date: string): InterventionFeedback => ({ id: `f-${date}`, interventionId: 'daylightWalk', date, rating: 1 });
  /** 30 nights around 40 ms, with chosen nights lifted or lowered. */
  const nightsWith = (special: Record<number, number>) =>
    Array.from({ length: 30 }, (_, i) => sensor(addDaysISO(TODAY, -i), { nightHrvMs: special[i] ?? 40 + (i % 3) - 1 }));

  it('is positive when the nights after the step were better than the person’s own usual', () => {
    const response = bodyResponse('daylightWalk', [fb(addDaysISO(TODAY, -2)), fb(addDaysISO(TODAY, -6))], nightsWith({ 2: 48, 6: 47 }));
    expect(response?.nights).toBe(2);
    expect(response?.z).toBeGreaterThan(1);
    expect(respondsWell(response)).toBe(true);
  });

  it('is not claimed for a step that was followed by ordinary or worse nights', () => {
    expect(respondsWell(bodyResponse('daylightWalk', [fb(addDaysISO(TODAY, -2)), fb(addDaysISO(TODAY, -6))], nightsWith({})))).toBe(false);
    expect(respondsWell(bodyResponse('daylightWalk', [fb(addDaysISO(TODAY, -2)), fb(addDaysISO(TODAY, -6))], nightsWith({ 2: 30, 6: 31 })))).toBe(false);
  });

  it('needs at least two nights and a baseline, and ignores other steps', () => {
    expect(bodyResponse('daylightWalk', [fb(addDaysISO(TODAY, -2))], nightsWith({ 2: 48 }))).toBeNull();
    expect(bodyResponse('daylightWalk', [fb(addDaysISO(TODAY, -2)), fb(addDaysISO(TODAY, -6))], [])).toBeNull();
    expect(bodyResponse('breathing', [fb(addDaysISO(TODAY, -2)), fb(addDaysISO(TODAY, -6))], nightsWith({ 2: 48, 6: 47 }))).toBeNull();
  });
});
