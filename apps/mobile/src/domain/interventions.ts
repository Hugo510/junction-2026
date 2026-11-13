import type { Intervention, InterventionId } from './entities';

export const INTERVENTIONS: readonly Intervention[] = [
  { id: 'breathing', minutes: 2, tags: ['calm'], guided: true },
  { id: 'daylightWalk', minutes: 10, tags: ['light', 'movement'], guided: true },
  { id: 'reachOut', minutes: 2, tags: ['social'], guided: false },
  { id: 'move', minutes: 2, tags: ['movement'], guided: true },
  { id: 'fireplace', minutes: 3, tags: ['calm'], guided: true },
  { id: 'fish', minutes: 3, tags: ['calm'], guided: true },
  { id: 'puzzle', minutes: 5, tags: ['focus'], guided: true },
  { id: 'gratitude', minutes: 2, tags: ['calm'], guided: false },
];

export const INTERVENTION_IDS: readonly InterventionId[] = INTERVENTIONS.map((i) => i.id);

export function getIntervention(id: InterventionId): Intervention {
  const found = INTERVENTIONS.find((i) => i.id === id);
  if (!found) throw new Error(`Unknown intervention: ${id}`);
  return found;
}
