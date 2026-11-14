import type { ISODate } from './dates';

export type { ISODate } from './dates';

export type Scale5 = 1 | 2 | 3 | 4 | 5;
export type SupportedLanguage = 'en' | 'fi' | 'es' | 'sv';

export type CompanionSpecies = 'bee' | 'cat' | 'dog' | 'bird' | 'person';

export interface Companion {
  species: CompanionSpecies;
  name: string;
}

/** Fictional patient profile. Only synthetic data is ever stored. */
export interface Patient {
  id: string;
  createdAt: string;
  companion: Companion;
  /** Set by the clinic ONLY (never self-declared). Enables the upwardDrift rule. */
  bipolarFlag?: boolean;
}

/** Aggregated result of the "tap when the circle glows" game. Individual taps are never stored. */
export interface ReactionAggregate {
  meanMs: number;
  sdMs: number;
  /** Share of rounds tapped correctly (0–1). */
  accuracy: number;
  rounds: number;
}

export type EmotionId =
  | 'calm'
  | 'content'
  | 'grateful'
  | 'hopeful'
  | 'proud'
  | 'tired'
  | 'sad'
  | 'anxious'
  | 'irritable'
  | 'lonely'
  | 'overwhelmed'
  | 'numb';

/** Where an entry came from: full check-in form, chat with the companion, or the journal. */
export type CheckInKind = 'full' | 'chat' | 'journal';

/**
 * One entry of the emotional journal. Full check-ins include energy, tension and sleep;
 * quick entries (chat / journal) may only have mood, feelings and a note.
 */
export interface CheckIn {
  id: string;
  date: ISODate;
  createdAt: string;
  /** Missing on older data = 'full'. */
  kind?: CheckInKind;
  mood: Scale5;
  emotions?: EmotionId[];
  energy?: Scale5;
  anxiety?: Scale5;
  sleepHours?: number;
  note?: string;
  reaction?: ReactionAggregate;
  /** Answer to the safety question (thoughts of self-harm in recent days). */
  safetyConcern: boolean;
}

/** Daily aggregate derived from phone sensors. No raw samples or coordinates. */
export interface SensorAggregate {
  date: ISODate;
  activityMinutes: number;
  daylightMinutes: number;
}

export type InterventionId =
  | 'breathing'
  | 'fireplace'
  | 'fish'
  | 'puzzle'
  | 'move'
  | 'daylightWalk'
  | 'reachOut'
  | 'gratitude';

export type InterventionTag = 'calm' | 'light' | 'movement' | 'social' | 'focus';

export interface Intervention {
  id: InterventionId;
  minutes: number;
  tags: InterventionTag[];
  /** true when the app has a guided screen for it. */
  guided: boolean;
}

/** 1 = helped, 0 = neutral, -1 = did not help. */
export type FeedbackRating = 1 | 0 | -1;

export interface InterventionFeedback {
  id: string;
  interventionId: InterventionId;
  date: ISODate;
  rating: FeedbackRating;
}

export type PlanItemStatus = 'pending' | 'done' | 'notToday';

export interface PlanItem {
  interventionId: InterventionId;
  status: PlanItemStatus;
}

export interface DailyPlan {
  date: ISODate;
  items: PlanItem[];
}

export type DoctorRole = 'psychiatrist' | 'nurse' | 'psychologist';

export interface Doctor {
  id: string;
  name: string;
  role: DoctorRole;
  languages: SupportedLanguage[];
  /** Simulated free slots (ISO datetimes) within the next 48 h. */
  slots: string[];
}

export type ConsultReason = 'moodLower' | 'sleep' | 'worried' | 'treatment' | 'talk';
export type PerceivedUrgency = 'low' | 'medium' | 'high';
export type PriorityLevel = 'low' | 'medium' | 'high';

export interface PriorityResult {
  score: number;
  level: PriorityLevel;
  /** i18n keys explaining the score. */
  reasons: string[];
}

export interface ConsultRequest {
  id: string;
  createdAt: string;
  reason: ConsultReason;
  perceivedUrgency: PerceivedUrgency;
  priority: PriorityResult;
  /** Position in the simulated queue at creation time (1 = next). */
  initialPosition: number;
}

export interface Alert {
  id: string;
  createdAt: string;
  /** urgent = safety path; info = gentle note (e.g. lost touch, with consent). */
  level: 'urgent' | 'info';
  source: 'checkIn' | 'chat' | 'contactCareTeam' | 'silence';
}
