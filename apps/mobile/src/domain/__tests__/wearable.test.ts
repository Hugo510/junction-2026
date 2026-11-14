import { PERSONAS, rebasePersona } from '../../data/personas';
import { addDaysISO } from '../dates';
import type { CheckIn, SensorAggregate } from '../entities';
import { priorityScore } from '../priorityScore';
import { mergeWearable, simulateWearable, simulateWearableDay, wearableSummary } from '../wearable';

const TODAY = '2026-11-15';

const sensor = (date: string, extra: Partial<SensorAggregate> = {}): SensorAggregate => ({ date, activityMinutes: 30, daylightMinutes: 30, ...extra });
const checkIn = (date: string, extra: Partial<CheckIn> = {}): CheckIn => ({ id: `c-${date}`, date, createdAt: `${date}T08:00:00.000Z`, mood: 4, safetyConcern: false, ...extra });

describe('simulated wearable', () => {
  it('is deterministic: the same day always gives the same totals', () => {
    expect(simulateWearableDay(TODAY)).toEqual(simulateWearableDay(TODAY));
    expect(simulateWearableDay(TODAY)).not.toEqual(simulateWearableDay(addDaysISO(TODAY, -1)));
  });

  it('stays inside plausible ranges', () => {
    for (const d of simulateWearable({ checkIns: [], sensors: [], today: TODAY, days: 90 })) {
      expect(d.sleepHours).toBeGreaterThanOrEqual(4);
      expect(d.sleepHours).toBeLessThanOrEqual(9.8);
      expect(d.steps).toBeGreaterThanOrEqual(300);
      expect(d.restingHr).toBeGreaterThanOrEqual(48);
      expect(d.restingHr).toBeLessThanOrEqual(88);
    }
  });

  it('follows the person’s own data: reported sleep, later evenings, less movement', () => {
    expect(Math.abs(simulateWearableDay(TODAY, checkIn(TODAY, { sleepHours: 5 })).sleepHours - 5)).toBeLessThanOrEqual(0.3);
    const early = simulateWearableDay(TODAY, undefined, sensor(TODAY, { screenOffTime: '22:30' }));
    const late = simulateWearableDay(TODAY, undefined, sensor(TODAY, { screenOffTime: '01:30' }));
    expect(late.sleepHours).toBeLessThan(early.sleepHours);
    const active = simulateWearableDay(TODAY, undefined, sensor(TODAY, { activityMinutes: 60 }));
    const still = simulateWearableDay(TODAY, undefined, sensor(TODAY, { activityMinutes: 5 }));
    expect(still.steps).toBeLessThan(active.steps);
    expect(simulateWearableDay(TODAY, undefined, sensor(TODAY, { steps: 4321 })).steps).toBe(4321);
  });

  it('covers the last N days up to today, oldest first', () => {
    const days = simulateWearable({ checkIns: [], sensors: [], today: TODAY, days: 7 });
    expect(days.map((d) => d.date)).toEqual([-6, -5, -4, -3, -2, -1, 0].map((i) => addDaysISO(TODAY, i)));
  });

  it('only enriches days the phone already has and keeps the phone’s own steps', () => {
    const days = simulateWearable({ checkIns: [], sensors: [], today: TODAY, days: 3 });
    const merged = mergeWearable([sensor(TODAY, { steps: 999 }), sensor('2026-01-01')], days);
    expect(merged).toHaveLength(2);
    expect(merged[0].steps).toBe(999);
    expect(merged[0].sleepHours).toBe(days[2].sleepHours);
    expect(merged[1]).toEqual(sensor('2026-01-01'));
  });

  it('summarises the week against the person’s own usual', () => {
    const days = simulateWearable({ checkIns: [], sensors: [], today: TODAY });
    const summary = wearableSummary(days, TODAY);
    expect(summary.sleep.week).toHaveLength(7);
    expect(summary.sleep.latest).toBe(days[days.length - 1].sleepHours);
    expect(summary.steps.latest).toBe(days[days.length - 2].steps);
    expect(summary.heart.usual).toBeGreaterThan(48);
    expect(wearableSummary([], TODAY).sleep).toEqual({ latest: undefined, week: [], usual: undefined });
  });
});

describe('wearable sleep in the priority score', () => {
  it('fills in nights the person did not log, with the same rule and the same weight', () => {
    const sensors = Array.from({ length: 7 }, (_, i) => sensor(addDaysISO(TODAY, -i), { sleepHours: i < 3 ? 4.2 : 7.5 }));
    const checkIns = Array.from({ length: 7 }, (_, i) => checkIn(addDaysISO(TODAY, -i)));
    const withWearable = priorityScore({ checkIns, sensors, today: TODAY });
    expect(withWearable.reasons).toContain('priority.reasons.shortSleep');
    expect(withWearable.score).toBe(15);
    const without = priorityScore({ checkIns, sensors: sensors.map(({ sleepHours: _s, ...rest }) => rest), today: TODAY });
    expect(without.reasons).not.toContain('priority.reasons.shortSleep');
  });

  it('what the person reported wins over the measured value', () => {
    const sensors = Array.from({ length: 7 }, (_, i) => sensor(addDaysISO(TODAY, -i), { sleepHours: 4.2 }));
    const checkIns = Array.from({ length: 7 }, (_, i) => checkIn(addDaysISO(TODAY, -i), { sleepHours: 7.5 }));
    expect(priorityScore({ checkIns, sensors, today: TODAY }).reasons).not.toContain('priority.reasons.shortSleep');
  });

  it('connecting a wearable does not move any of the five personas to another level on demo day', () => {
    for (const persona of PERSONAS) {
      const data = rebasePersona(persona, addDaysISO(TODAY, -1));
      const flags = { bipolar: persona.persona.bipolarFlag };
      const plain = priorityScore({ checkIns: data.checkIns, sensors: data.sensors, today: TODAY, flags });
      const sensors = mergeWearable(data.sensors, simulateWearable({ checkIns: data.checkIns, sensors: data.sensors, today: TODAY }));
      const connected = priorityScore({ checkIns: data.checkIns, sensors, today: TODAY, flags });
      expect({ id: persona.persona.id, level: connected.level }).toEqual({ id: persona.persona.id, level: plain.level });
    }
  });
});
