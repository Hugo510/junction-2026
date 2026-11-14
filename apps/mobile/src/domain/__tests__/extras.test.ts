import { toBackendCheckIn, toBackendConsents } from '../../data/api/mapping';
import { PERSONAS, rebasePersona } from '../../data/personas';
import { addDaysISO } from '../dates';
import type { CheckIn, InterventionFeedback, SensorAggregate } from '../entities';
import { availableInterventionIds, INTERVENTION_IDS } from '../interventions';
import { computeArmStats, populationPriors, PRIOR_MEAN, rankInterventions } from '../interventionPicker';
import { priorityScore } from '../priorityScore';

const TODAY = '2026-11-15';

function sensorsWithScreenOff(recent: string, usual: string): SensorAggregate[] {
  return Array.from({ length: 60 }, (_, i) => ({
    date: addDaysISO(TODAY, -i),
    activityMinutes: 30,
    daylightMinutes: 30,
    screenOffTime: i < 7 ? recent : usual,
  }));
}

const fb = (interventionId: InterventionFeedback['interventionId'], rating: 1 | 0 | -1, i: number): InterventionFeedback => ({
  id: `f-${interventionId}-${i}`,
  interventionId,
  date: addDaysISO(TODAY, -i - 1),
  rating,
});

describe('wind-down step (C6)', () => {
  it('is not offered when evenings look like the person’s own usual', () => {
    expect(availableInterventionIds({ sensors: sensorsWithScreenOff('23:00', '23:00'), today: TODAY })).not.toContain('windDown');
    expect(availableInterventionIds({ sensors: [], today: TODAY })).not.toContain('windDown');
  });

  it('is offered only when the last screen-off drifted an hour or more later', () => {
    const ids = availableInterventionIds({ sensors: sensorsWithScreenOff('00:40', '23:00'), today: TODAY });
    expect(ids).toContain('windDown');
    expect(ids).toHaveLength(INTERVENTION_IDS.length);
  });

  it('every other action is always available', () => {
    const ids = availableInterventionIds({ sensors: [], today: TODAY });
    expect(ids).toEqual(INTERVENTION_IDS.filter((id) => id !== 'windDown'));
    expect(ids).toContain('seaSounds');
  });
});

describe('population prior (S4, loop 3)', () => {
  const liked = [fb('seaSounds', 1, 0), fb('seaSounds', 1, 1)];
  const disliked = [fb('seaSounds', -1, 0), fb('seaSounds', -1, 1)];

  it('needs at least two people with at least two ratings each', () => {
    expect(populationPriors(['seaSounds'], [{ feedback: liked, checkIns: [] }])).toEqual({});
    expect(populationPriors(['seaSounds'], [{ feedback: [liked[0]], checkIns: [] }, { feedback: [liked[0]], checkIns: [] }])).toEqual({});
  });

  it('is the clamped average of each person’s own mean', () => {
    const both = populationPriors(['seaSounds'], [{ feedback: liked, checkIns: [] }, { feedback: liked, checkIns: [] }]);
    expect(both.seaSounds).toBe(0.5);
    const mixed = populationPriors(['seaSounds'], [{ feedback: liked, checkIns: [] }, { feedback: disliked, checkIns: [] }]);
    expect(mixed.seaSounds).toBe(0);
  });

  it('only moves the starting point: own feedback soon outweighs it', () => {
    const priors = { seaSounds: 0.5 };
    expect(rankInterventions(['breathing', 'seaSounds'], [], [], priors)[0].id).toBe('seaSounds');
    expect(computeArmStats(['breathing'], [], [], priors)[0].mean).toBe(PRIOR_MEAN);
    const own = [fb('seaSounds', -1, 0), fb('seaSounds', -1, 1), fb('seaSounds', -1, 2)];
    expect(rankInterventions(['breathing', 'seaSounds'], own, [], priors)[0].id).toBe('breathing');
  });

  it('the five synthetic personas give a prior without changing anyone’s own top action', () => {
    const priors = populationPriors(INTERVENTION_IDS, PERSONAS);
    expect(Object.keys(priors).length).toBeGreaterThan(0);
    for (const value of Object.values(priors)) expect(Math.abs(value as number)).toBeLessThanOrEqual(0.5);
    for (const persona of PERSONAS) {
      const data = rebasePersona(persona, addDaysISO(TODAY, -1));
      const top = (p = {}) => rankInterventions(INTERVENTION_IDS, data.feedback, data.checkIns, p).find((r) => r.n > 0)?.id;
      expect(top(priors)).toBe(top());
    }
  });
});

describe('clinic early signs (S3)', () => {
  const aino = PERSONAS.find((p) => p.persona.id === 'aino');
  const data = aino ? rebasePersona(aino, addDaysISO(TODAY, -1)) : null;

  it('names the clinic-set sign first and never changes the score', () => {
    if (!data) throw new Error('aino persona missing');
    const plain = priorityScore({ checkIns: data.checkIns, sensors: data.sensors, today: TODAY });
    const watched = priorityScore({ checkIns: data.checkIns, sensors: data.sensors, today: TODAY, flags: { earlySigns: ['laterNights'] } });
    expect(plain.clinicSigns).toBeUndefined();
    expect(plain.reasons).toContain('priority.reasons.laterNights');
    expect(watched.score).toBe(plain.score);
    expect(watched.level).toBe(plain.level);
    expect(watched.reasons[0]).toBe('priority.reasons.laterNights');
    expect(watched.clinicSigns).toEqual(['priority.reasons.laterNights']);
    expect([...watched.reasons].sort()).toEqual([...plain.reasons].sort());
  });

  it('a watched sign that did not show up changes nothing', () => {
    const leena = PERSONAS.find((p) => p.persona.id === 'leena');
    if (!leena) throw new Error('leena persona missing');
    const d = rebasePersona(leena, addDaysISO(TODAY, -1));
    const plain = priorityScore({ checkIns: d.checkIns, sensors: d.sensors, today: TODAY });
    const watched = priorityScore({ checkIns: d.checkIns, sensors: d.sensors, today: TODAY, flags: { earlySigns: ['laterNights', 'homeMore'] } });
    expect(watched).toEqual(plain);
  });
});

describe('backend mirror mapping', () => {
  const base: CheckIn = { id: 'c1', date: TODAY, createdAt: `${TODAY}T08:00:00.000Z`, mood: 2, safetyConcern: true, note: 'private words', emotions: ['calm'] };

  it('never sends free text, feelings or the body map', () => {
    const body = toBackendCheckIn({ ...base, bodyMap: { chest: 1 } });
    expect(JSON.stringify(body)).not.toContain('private words');
    expect(Object.keys(body).sort()).toEqual(['date', 'kind', 'mood', 'safety']);
    expect(body).not.toHaveProperty('note');
    expect(body).not.toHaveProperty('emotions');
    expect(body).not.toHaveProperty('bodyMap');
  });

  it('keeps the safety answer and does not invent energy or anxiety', () => {
    expect(toBackendCheckIn(base)).toEqual({ date: TODAY, mood: 2, kind: 'full', safety: { selfHarmThoughts: true } });
    const full = toBackendCheckIn({ ...base, kind: 'chat', energy: 1, anxiety: 5, sleepHours: 30, reaction: { meanMs: 400, sdMs: 50, accuracy: 0.9, rounds: 8 } });
    expect(full).toMatchObject({ kind: 'chat', energy: 1, anxiety: 5, sleepHours: 24, reactionGame: { rounds: 8, meanMs: 400, sdMs: 50, accuracy: 0.9 } });
  });

  it('fills the midpoint only for an older server that requires both fields', () => {
    expect(toBackendCheckIn(base, { legacy: true })).toMatchObject({ energy: 3, anxiety: 3 });
    expect(toBackendCheckIn({ ...base, energy: 5 }, { legacy: true })).toMatchObject({ energy: 5, anxiety: 3 });
  });

  it('maps the sensor consents and the contact-after-silence consent', () => {
    expect(toBackendConsents({ movement: true, taps: false, location: true, vibration: false, careTeamAfterSilence: true })).toEqual({
      motion: true,
      touchPattern: false,
      approximateLocation: true,
      vibration: false,
      careTeamAfterSilence: true,
    });
    expect(toBackendConsents({ movement: false, taps: false, location: false, vibration: false }).careTeamAfterSilence).toBe(false);
  });
});
