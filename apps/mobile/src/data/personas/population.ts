import { INTERVENTION_IDS } from '../../domain/interventions';
import { populationPriors, type ArmPriors } from '../../domain/interventionPicker';
import { PERSONAS } from './index';

let cached: ArmPriors | null = null;

/**
 * "Other people" in the demo = the five SYNTHETIC personas bundled with the app.
 * Later this comes from the backend as the same thing: one average score per action,
 * built from several consenting people, never from one person.
 */
export function demoPopulationPriors(): ArmPriors {
  cached ??= populationPriors(INTERVENTION_IDS, PERSONAS);
  return cached;
}
