import type { ISODate } from './dates';
import type { Intervention, InterventionId, SensorAggregate } from './entities';
import { LATER_NIGHT_MIN, signalDrift } from './priorityScore';

export const INTERVENTIONS: readonly Intervention[] = [
  { id: 'breathing', minutes: 2, tags: ['calm'], guided: true },
  { id: 'daylightWalk', minutes: 10, tags: ['light', 'movement'], guided: true },
  { id: 'reachOut', minutes: 2, tags: ['social'], guided: false },
  { id: 'move', minutes: 2, tags: ['movement'], guided: true },
  { id: 'fireplace', minutes: 3, tags: ['calm'], guided: true },
  { id: 'fish', minutes: 3, tags: ['calm'], guided: true },
  { id: 'puzzle', minutes: 5, tags: ['focus'], guided: true },
  { id: 'gratitude', minutes: 2, tags: ['calm'], guided: false },
  { id: 'seaSounds', minutes: 3, tags: ['calm'], guided: true },
  // Conditional: see availableInterventionIds().
  { id: 'windDown', minutes: 1, tags: ['calm'], guided: false },
];

export const INTERVENTION_IDS: readonly InterventionId[] = INTERVENTIONS.map((i) => i.id);

export function getIntervention(id: InterventionId): Intervention {
  const found = INTERVENTIONS.find((i) => i.id === id);
  if (!found) throw new Error(`Unknown intervention: ${id}`);
  return found;
}

/**
 * What may be offered today.
 *
 * "Phone out of the bedroom tonight" (windDown) is offered ONLY when the last screen-off of the
 * evening has drifted later than the person's OWN usual. It is never a general sleep rule,
 * the app never reads what is on the screen, and "no thanks" is always fine.
 */
export function availableInterventionIds(input: { sensors: SensorAggregate[]; today: ISODate }): InterventionId[] {
  const later = (signalDrift(input).screenOffDeltaMin ?? 0) >= LATER_NIGHT_MIN;
  return INTERVENTION_IDS.filter((id) => id !== 'windDown' || later);
}
