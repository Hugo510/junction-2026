import type { CheckIn, CheckInKind } from '../../domain/entities';

/** Body of POST /api/v1/checkins on our backend (camelCase, see backend/app/schemas/checkin.py). */
export interface BackendCheckIn {
  date: string;
  mood: number;
  /** Optional since the backend's 14 Nov contract; sent only when the person answered it. */
  energy?: number;
  anxiety?: number;
  sleepHours?: number;
  /** Where the entry came from (full form, chat or journal). */
  kind: CheckInKind;
  reactionGame?: { rounds: number; meanMs: number; sdMs: number; accuracy: number };
  safety: { selfHarmThoughts: boolean };
}

/** Flags of PUT /api/v1/me/consents. */
export interface BackendConsents {
  motion: boolean;
  touchPattern: boolean;
  approximateLocation: boolean;
  vibration: boolean;
  careTeamAfterSilence: boolean;
}

/** Midpoint used only for an older server that still requires energy and anxiety. */
export const NEUTRAL_SCALE = 3;

/**
 * App check-in → backend check-in.
 *
 * Privacy: free text (the note), feelings and the body map NEVER leave the phone, even though
 * the backend now has optional fields for them. Only the numbers the server needs are sent.
 *
 * `legacy` = fill energy/anxiety with the midpoint, for a server on the old contract that
 * rejects a check-in without them (the one-tap daily moment has neither). The current
 * contract makes them optional, so by default nothing is invented.
 */
export function toBackendCheckIn(c: CheckIn, { legacy = false }: { legacy?: boolean } = {}): BackendCheckIn {
  const body: BackendCheckIn = {
    date: c.date,
    mood: c.mood,
    kind: c.kind ?? 'full',
    safety: { selfHarmThoughts: c.safetyConcern },
  };
  const energy = c.energy ?? (legacy ? NEUTRAL_SCALE : undefined);
  const anxiety = c.anxiety ?? (legacy ? NEUTRAL_SCALE : undefined);
  if (energy !== undefined) body.energy = energy;
  if (anxiety !== undefined) body.anxiety = anxiety;
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

/**
 * After a 409 ("this day already has a check-in") the mirror replaces the day's entry with PUT.
 * It must NOT do that when an earlier entry today was a safety report and this one is not:
 * on an older server the PUT would overwrite that report. The report stays; this copy is skipped.
 */
export function shouldReplaceOnConflict(checkIn: Pick<CheckIn, 'safetyConcern'>, safetyReportedToday: boolean): boolean {
  return checkIn.safetyConcern || !safetyReportedToday;
}

export function toBackendConsents(c: { movement: boolean; taps: boolean; location: boolean; vibration: boolean; careTeamAfterSilence?: boolean }): BackendConsents {
  return {
    motion: c.movement,
    touchPattern: c.taps,
    approximateLocation: c.location,
    vibration: c.vibration,
    careTeamAfterSilence: !!c.careTeamAfterSilence,
  };
}
