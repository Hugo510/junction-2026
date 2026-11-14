import { blendWithPrior, isWeekend, referenceStats, statsForDay, wellReference } from '../baseline';
import { addDaysISO } from '../dates';
import { detectDrift, EWMA_LIMIT, variabilityRise } from '../drift';
import type { CheckIn, Phq9Entry, SensorAggregate } from '../entities';
import { personalTrends, priorityScore } from '../priorityScore';

const TODAY = '2026-11-15'; // a Sunday
const FIRST = addDaysISO(TODAY, -89); // 90 days of data
const dayAt = (i: number) => addDaysISO(FIRST, i);

const checkIn = (i: number, mood: number, extra: Partial<CheckIn> = {}): CheckIn => ({
  id: `c${i}`,
  date: dayAt(i),
  createdAt: `${dayAt(i)}T08:00:00.000Z`,
  mood: mood as CheckIn['mood'],
  safetyConcern: false,
  ...extra,
});
const sensor = (i: number, extra: Partial<SensorAggregate> = {}): SensorAggregate => ({ date: dayAt(i), activityMinutes: 40, daylightMinutes: 30, ...extra });
const phq = (i: number, total: number, kind: 'phq9' | 'phq2' = 'phq9'): Phq9Entry => ({
  date: dayAt(i),
  kind,
  total,
  items: kind === 'phq9' ? [total, 0, 0, 0, 0, 0, 0, 0, 0].map((v) => Math.min(3, v)) : [Math.min(3, total), 0],
});
/** Small deterministic day-to-day wobble, so standard deviations are not zero. */
const wobble = (i: number) => (i % 3) - 1;

describe('staged baseline (points 2 and 6)', () => {
  it('moves through the phases with the days of data', () => {
    const at = (days: number) => wellReference({ sensors: Array.from({ length: days }, (_, i) => sensor(i)), today: dayAt(days - 1) });
    expect(at(10)).toMatchObject({ phase: 1, daysOfData: 10 });
    expect(at(14).phase).toBe(1);
    expect(at(15).phase).toBe(2);
    expect(at(56).phase).toBe(2);
    expect(at(57).phase).toBe(3);
    expect(wellReference({ today: TODAY })).toMatchObject({ phase: 1, daysOfData: 0, days: [] });
  });

  it('starts from a population prior and shifts to the person over two weeks', () => {
    expect(wellReference({ sensors: [sensor(0)], today: dayAt(6) }).personalShare).toBe(0.5);
    expect(wellReference({ sensors: [sensor(0)], today: dayAt(40) }).personalShare).toBe(1);
    expect(blendWithPrior(4000, 7000, 0.5)).toBe(5500);
    expect(blendWithPrior(undefined, 7000, 0.5)).toBe(7000);
    expect(blendWithPrior(4000, 7000, 1)).toBe(4000);
  });

  it('has no reference before week 3, so trend rules stay off while averages are learned', () => {
    const sensors = Array.from({ length: 18 }, (_, i) => sensor(i, { homeMinutes: 900 }));
    const early = personalTrends({ sensors, today: dayAt(17) });
    expect(early.reference.blocks).toEqual([]);
    expect(early.trends).toEqual({});
    const week3 = personalTrends({ sensors: Array.from({ length: 21 }, (_, i) => sensor(i, { homeMinutes: 900 + wobble(i) * 10 })), today: dayAt(20) });
    expect(week3.reference.blocks).toEqual([{ start: dayAt(0), end: dayAt(13), confirmedBy: 'start' }]);
    expect(week3.trends.home).toBeDefined();
  });

  it('keeps weekdays and weekends apart', () => {
    expect(isWeekend('2026-11-14')).toBe(true); // Saturday
    expect(isWeekend('2026-11-16')).toBe(false); // Monday
    // At home 800 min on weekdays and 1100 on weekends: a normal weekend must not look like drift.
    const home = (i: number) => (isWeekend(dayAt(i)) ? 1100 : 800) + wobble(i) * 10;
    const sensors = Array.from({ length: 90 }, (_, i) => sensor(i, { homeMinutes: home(i) }));
    const reference = wellReference({ sensors, today: TODAY });
    const stats = referenceStats((d) => sensors.find((s) => s.date === d)?.homeMinutes, reference);
    expect(stats?.weekday?.mean).toBeCloseTo(800, -1);
    expect(stats?.weekend?.mean).toBeCloseTo(1100, -1);
    expect(statsForDay('2026-11-14', stats!).mean).toBeGreaterThan(1000);
    expect(personalTrends({ sensors, today: TODAY }).trends.home?.triggered).toBe(false);
  });

  it('variability is used only with a long reference (phase 3 and at least 42 reference days)', () => {
    const sensors = Array.from({ length: 90 }, (_, i) => sensor(i, { screenOffTime: i >= 83 ? (i % 2 ? '21:30' : '01:30') : '23:00' }));
    // Without questionnaires only the first two weeks are the reference: too short for variability.
    expect(personalTrends({ sensors, today: TODAY }).variabilityReady).toBe(false);
    const confirmed = [phq(20, 3), phq(34, 4), phq(48, 3)];
    const long = personalTrends({ sensors, phq9: confirmed, today: TODAY });
    expect(long.variabilityReady).toBe(true);
    expect(long.variability.nights?.triggered).toBe(true);
    expect(priorityScore({ checkIns: [], sensors, phq9: confirmed, today: TODAY }).reasons).toContain('priority.reasons.irregularNights');
  });
});

describe('anchored baseline: "last known well" (point 3)', () => {
  // 90 days: well for 6 weeks, then a slow slide that stays low for 6 weeks.
  const mood = (i: number) => (i < 42 ? 4 : 2);
  const checkIns = Array.from({ length: 90 }, (_, i) => checkIn(i, mood(i)));
  const sensors = Array.from({ length: 90 }, (_, i) => sensor(i, { homeMinutes: (i < 42 ? 900 : 1150) + wobble(i) * 10 }));

  it('a relapse never becomes the new normal: the reference stays on the well period', () => {
    const questionnaires = [phq(14, 4), phq(28, 5), phq(42, 12), phq(56, 14), phq(70, 15)];
    const reference = wellReference({ checkIns, sensors, phq9: questionnaires, today: TODAY });
    // The block just before the slide is not confirmed either: the high questionnaire a few days
    // later casts doubt on it. Nothing from the slide itself is in the reference.
    expect(reference.blocks.map((b) => b.confirmedBy)).toEqual(['start', 'questionnaire']);
    expect(reference.days[reference.days.length - 1] < dayAt(42)).toBe(true);
    // Six weeks into the slide the signal is still alive.
    const trends = personalTrends({ checkIns, sensors, phq9: questionnaires, today: TODAY }).trends;
    expect(trends.home?.triggered).toBe(true);
    expect(trends.mood?.triggered).toBe(true);
    expect(priorityScore({ checkIns, sensors, phq9: questionnaires, today: TODAY }).reasons).toEqual(
      expect.arrayContaining(['priority.reasons.belowBaseline', 'priority.reasons.homeMore']),
    );
  });

  it('a block is added only when a questionnaire confirms the person was well', () => {
    const blocks = (phq9: Phq9Entry[]) => wellReference({ checkIns, sensors, phq9, today: TODAY }).blocks.length;
    expect(blocks([])).toBe(1); // no questionnaire: only the first two weeks
    expect(blocks([phq(20, 3)])).toBe(2);
    expect(blocks([phq(20, 12)])).toBe(1); // a high questionnaire never confirms
    expect(blocks([phq(20, 1, 'phq2')])).toBe(2); // the two-question check counts when it is low
    expect(blocks([phq(20, 4, 'phq2')])).toBe(1);
  });

  it('a low questionnaire does not confirm a block with clearly lower mood or a safety answer', () => {
    // A low questionnaire on day 48 confirms the well block that ended a week before (days 28–41),
    // but not its own block (days 42–55), where mood is 2, far below where the person started.
    const low = wellReference({ checkIns, sensors, phq9: [phq(48, 5)], today: TODAY });
    expect(low.blocks.map((b) => b.start)).toEqual([dayAt(0), dayAt(28)]);
    const safety = checkIns.map((c, i) => (i === 20 ? { ...c, safetyConcern: true } : c));
    expect(wellReference({ checkIns: safety, sensors, phq9: [phq(20, 3)], today: TODAY }).blocks).toHaveLength(1);
  });

  it('the days being judged never feed the reference, and at most four blocks are kept', () => {
    const well = Array.from({ length: 90 }, (_, i) => checkIn(i, 4));
    const every2Weeks = [14, 28, 42, 56, 70, 84].map((i) => phq(i, 3));
    const reference = wellReference({ checkIns: well, sensors, phq9: every2Weeks, today: TODAY });
    expect(reference.blocks).toHaveLength(4);
    expect(reference.days[reference.days.length - 1] <= addDaysISO(TODAY, -7)).toBe(true);
  });
});

describe('smoothed trend against the person’s own limit (point 1)', () => {
  const steady = (i: number) => 40 + wobble(i) * 4;
  const reference = (get: (i: number) => number) => {
    const sensors = Array.from({ length: 90 }, (_, i) => sensor(i, { activityMinutes: get(i) }));
    const ref = wellReference({ sensors, today: TODAY });
    const value = (d: string) => sensors.find((s) => s.date === d)?.activityMinutes;
    return { stats: referenceStats(value, ref)!, value };
  };

  it('uses the standard control limit: 3 sigma with a smoothing weight of 0.2', () => {
    expect(EWMA_LIMIT).toBeCloseTo(1, 5);
  });

  it('stays quiet for ordinary days and for one unusually bad day', () => {
    const calm = reference(steady);
    expect(detectDrift(calm.value, calm.stats, TODAY, { direction: 'down', minSd: 2 })).toMatchObject({ triggered: false, outsideDays: 0 });
    const oneBadDay = reference((i) => (i === 88 ? 5 : steady(i)));
    expect(detectDrift(oneBadDay.value, oneBadDay.stats, TODAY, { direction: 'down', minSd: 2 }).triggered).toBe(false);
  });

  it('triggers when the trend stays outside the limit on 3 of the last 5 days', () => {
    const slide = reference((i) => (i >= 80 ? 20 : steady(i)));
    const drift = detectDrift(slide.value, slide.stats, TODAY, { direction: 'down', minSd: 2 });
    expect(drift.outsideDays).toBeGreaterThanOrEqual(3);
    expect(drift.triggered).toBe(true);
    expect(drift.points).toHaveLength(28);
    // The same change in the harmless direction is not a signal.
    const more = reference((i) => (i >= 80 ? 60 : steady(i)));
    expect(detectDrift(more.value, more.stats, TODAY, { direction: 'down', minSd: 2 }).triggered).toBe(false);
  });

  it('days without data neither move the trend nor count: silence is not a signal', () => {
    const slide = reference((i) => (i >= 80 ? 20 : steady(i)));
    const silent = (d: string) => (d > addDaysISO(TODAY, -4) ? undefined : slide.value(d));
    const drift = detectDrift(silent, slide.stats, TODAY, { direction: 'down', minSd: 2 });
    expect(drift.outsideDays).toBe(1); // only one of the last 5 days has data
    expect(drift.triggered).toBe(false);
  });

  it('variability compares this week’s swings with the person’s own', () => {
    const calm = reference(steady);
    expect(variabilityRise(calm.value, calm.stats, TODAY, 5)?.triggered).toBe(false);
    const swings = reference((i) => (i >= 83 ? (i % 2 ? 10 : 80) : steady(i)));
    expect(variabilityRise(swings.value, swings.stats, TODAY, 5)?.triggered).toBe(true);
    expect(variabilityRise(() => undefined, calm.stats, TODAY, 5)).toBeNull();
  });
});

describe('new rules in the score (points 1 and 5)', () => {
  const week = (extra: (i: number) => Partial<CheckIn>) => Array.from({ length: 7 }, (_, i) => checkIn(83 + i, 4, extra(i)));

  it('backup population check: under 5,000 steps on at least 5 of the last 7 days', () => {
    const steps = (values: number[]) => values.map((s, i) => sensor(83 + i, { steps: s }));
    const low = priorityScore({ checkIns: [], sensors: steps([3000, 4200, 4900, 2500, 6000, 4100, 3900]), today: TODAY });
    expect(low).toMatchObject({ score: 5, reasons: ['priority.reasons.lowSteps'] });
    expect(priorityScore({ checkIns: [], sensors: steps([3000, 4200, 6100, 2500, 6000, 4100, 7000]), today: TODAY }).score).toBe(0);
    // Too few days with steps: no conclusion.
    expect(priorityScore({ checkIns: [], sensors: steps([3000, 4200, 3100, 2500]), today: dayAt(86) }).score).toBe(0);
  });

  it('restlessness or irritability is an early sign', () => {
    expect(priorityScore({ checkIns: week(() => ({ restlessness: 4 })), sensors: [], today: TODAY }).reasons).toEqual(['priority.reasons.restless']);
    expect(priorityScore({ checkIns: week(() => ({ restlessness: 2 })), sensors: [], today: TODAY }).score).toBe(0);
    // The feeling chips from the daily chat count too.
    const chips = week((i) => (i < 3 ? { emotions: ['irritable'] } : {}));
    expect(priorityScore({ checkIns: chips, sensors: [], today: TODAY }).reasons).toEqual(['priority.reasons.restless']);
  });

  it('worry counts like anxiety, and is not counted twice', () => {
    expect(priorityScore({ checkIns: week(() => ({ worry: 5 })), sensors: [], today: TODAY }).reasons).toEqual(['priority.reasons.highAnxiety']);
    expect(priorityScore({ checkIns: week(() => ({ worry: 5, anxiety: 5 })), sensors: [], today: TODAY }).score).toBe(10);
  });
});
