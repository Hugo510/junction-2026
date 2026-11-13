import type { Href } from 'expo-router';

import type { InterventionId } from '../domain/entities';

/** Screen for each guided intervention (null = simple idea shown inline). */
export function interventionRoute(id: InterventionId): Href | null {
  switch (id) {
    case 'breathing':
      return '/exercise/breathing';
    case 'fireplace':
      return '/exercise/fireplace';
    case 'fish':
      return '/exercise/fish';
    case 'puzzle':
      return '/exercise/puzzle';
    case 'move':
      return '/exercise/move';
    case 'daylightWalk':
      return '/exercise/walk';
    default:
      return null;
  }
}
