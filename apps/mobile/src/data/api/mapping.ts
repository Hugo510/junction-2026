import type { CheckIn } from '../../domain/entities';

/** Body of POST /api/v1/checkins on our backend (camelCase, see backend/app/schemas/checkin.py). */
export interface BackendCheckIn {
  date: string;
  mood: number;
  energy: number;
  anxiety: number;
  sleepHours?: number;
  reactionGame?: { rounds: number; meanMs: number; sdMs: number; accuracy: number };
  safety: { selfHarmThoughts: boolean };
}

/** Flags of PUT /api/v1/me/consents. */
export interface BackendConsents {
  motion: boolean;
  touchPattern: boolean;
  approximateLocation: boolean;
  vibration: boolean;
}

/** The backend requires energy and anxiety; the one-tap daily moment has neither. */
export const NEUTRAL_SCALE = 3;

/**
 * App check-in → backend check-in.
 *
 * Privacy: free text (the note) NEVER leaves the phone, and neither do feelings or the body map.
 * Only numbers the server needs to keep its own queue in step are sent.
 */
export function toBackendCheckIn(c: CheckIn): BackendCheckIn {
  const body: BackendCheckIn = {
    date: c.date,
    mood: c.mood,
    energy: c.energy ?? NEUTRAL_SCALE,
    anxiety: c.anxiety ?? NEUTRAL_SCALE,
    safety: { selfHarmThoughts: c.safetyConcern },
  };
  if (typeof c.sleepHours === 'number') body.sleepHours = Math.min(24, Math.max(0, c.sleepHours));
  if (c.reaction && c.reaction.rounds >= 1) {
    body.reactionGame = {
      rounds: c.reaction.rounds,
      meanMs: c.reaction.meanMs,
      sdMs: c.reaction.sdMs,
      accuracy: Math.min(1, Math.max(0, c.reaction.accuracy)),
    };
  }
  return body;
}

export function toBackendConsents(c: { movement: boolean; taps: boolean; location: boolean; vibration: boolean }): BackendConsents {
  return { motion: c.movement, touchPattern: c.taps, approximateLocation: c.location, vibration: c.vibration };
}
