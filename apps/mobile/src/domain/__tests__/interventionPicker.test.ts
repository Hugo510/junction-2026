import { addDaysISO } from '../dates';
import type { FeedbackRating, InterventionFeedback, InterventionId } from '../entities';
import { INTERVENTION_IDS } from '../interventions';
import { pickInterventions, rankInterventions, rewardFor } from '../interventionPicker';
import { mulberry32 } from '../rng';

const START = '2026-10-01';

/** Ground truth used by the simulated user. The best arm is LAST in the catalog on purpose. */
const BEST: InterventionId = 'gratitude';
const truth = (id: InterventionId): FeedbackRating => (id === BEST ? 1 : id === 'puzzle' ? 0 : -1);

describe('interventionPicker', () => {
  it('is deterministic with a seed', () => {
    const a = pickInterventions({ ids: INTERVENTION_IDS, feedback: [], checkIns: [], rng: mulberry32(7) });
    const b = pickInterventions({ ids: INTERVENTION_IDS, feedback: [], checkIns: [], rng: mulberry32(7) });
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(3);
  });

  it('converges to the intervention with the best feedback', () => {
    const rng = mulberry32(42);
    const feedback: InterventionFeedback[] = [];
    const lastPicks: InterventionId[] = [];

    for (let day = 0; day < 120; day++) {
      const [pick] = pickInterventions({ ids: INTERVENTION_IDS, feedback, checkIns: [], rng, count: 1, epsilon: 0.1 });
      const date = addDaysISO(START, day);
      feedback.push({ id: `fb-${day}`, interventionId: pick, date, rating: truth(pick) });
      if (day >= 70) lastPicks.push(pick);
    }

    const ranking = rankInterventions(INTERVENTION_IDS, feedback, []);
    expect(ranking[0].id).toBe(BEST);
    const share = lastPicks.filter((p) => p === BEST).length / lastPicks.length;
    expect(share).toBeGreaterThan(0.8);
  });

  it('uses next-day mood change as extra reward', () => {
    const fb: InterventionFeedback = { id: 'f', interventionId: 'fish', date: START, rating: 0 };
    const base = { createdAt: 'x', energy: 3 as const, anxiety: 2 as const, sleepHours: 7, safetyConcern: false };
    const checkIns = [
      { ...base, id: 'a', date: START, mood: 2 as const },
      { ...base, id: 'b', date: addDaysISO(START, 1), mood: 4 as const },
    ];
    expect(rewardFor(fb, checkIns)).toBeCloseTo(0.5);
  });
});
