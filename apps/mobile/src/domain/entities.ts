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
  /** Where the person is in their care (chosen at onboarding). */
  carePath?: CarePath;
  /**
   * Clinic-only status (moved, transferred, deceased). Stops all outreach at once.
   * Never self-declared and never inferred from silence.
   */
  careEnded?: boolean;
}

/** The four starting points. Only postTreatment is live in this version. */
export type CarePath = 'postTreatment' | 'inTreatment' | 'stoppedTreatment' | 'notInCare';

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

export type BodyRegion =
  | 'head'
  | 'chest'
  | 'belly'
  | 'hips'
  | 'leftArm'
  | 'rightArm'
  | 'leftHand'
  | 'rightHand'
  | 'leftLeg'
  | 'rightLeg'
  | 'leftFoot'
  | 'rightFoot';

/** 1 = warm (more activity felt there), -1 = cool (less). Neutral regions are simply absent. */
export type BodyHeat = 1 | -1;

/**
 * "Where is your fire today?" — self-reported bodily map (method: Nummenmaa, Glerean, Hari &
 * Hietanen, PNAS 2014, doi 10.1073/pnas.1321664111). Self-report only, never a diagnosis.
 */
export type BodyMap = Partial<Record<BodyRegion, BodyHeat>>;

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
  bodyMap?: BodyMap;
  energy?: Scale5;
  anxiety?: Scale5;
  /** Early signs asked in the longer check-in (1 = not at all, 5 = a lot). */
  restlessness?: Scale5;
  worry?: Scale5;
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
  /** Optional passive signals (synthetic personas today; Health Connect / HealthKit later). */
  homeMinutes?: number;
  /** Local bedtime, "HH:mm". */
  bedtime?: string;
  /** Local time the phone screen was last turned off at night, "HH:mm". */
  screenOffTime?: string;
  steps?: number;
  nightPhoneMinutes?: number;
  /**
   * Wearable (watch or ring), names from docs/MEMO_BODY_LOOP.md. Night values belong to the date of
   * the EVENING the night starts, like bedtime and screenOffTime.
   */
  /** Night heart rate variability (RMSSD), in milliseconds. */
  nightHrvMs?: number;
  /** Resting heart rate, beats per minute. */
  restingHr?: number;
  sleepMinutes?: number;
  /** Local wake-up time of the next morning, "HH:mm". */
  wakeTime?: string;
  /** Minutes the device was worn that day (gaps = not worn, never "relapse"). */
  wearMinutes?: number;
  wearableSource?: 'watch' | 'ring';
}

/** PHQ-9 questionnaire: 9 items scored 0–3, total 0–27. Sensors only ask; questionnaires decide. */
export interface Phq9Entry {
  date: ISODate;
  /** 9 answers for a full PHQ-9, or the first 2 when only the PHQ-2 was asked. */
  items: number[];
  total: number;
  /** Missing = full PHQ-9. */
  kind?: 'phq2' | 'phq9';
}

export type InterventionId =
  | 'breathing'
  | 'fireplace'
  | 'fish'
  | 'puzzle'
  | 'move'
  | 'daylightWalk'
  | 'reachOut'
  | 'gratitude'
  | 'seaSounds'
  | 'windDown';

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

/** Early signs a clinician can ask Hiillos to watch for one person (they match priority rules). */
export type EarlySign = 'laterNights' | 'homeMore' | 'activityDrop';
export const EARLY_SIGNS: readonly EarlySign[] = ['laterNights', 'homeMore', 'activityDrop'];

export interface PriorityResult {
  score: number;
  level: PriorityLevel;
  /** i18n keys explaining the score. */
  reasons: string[];
  /** Reasons that match an early sign the clinic set for this person (they are listed first). */
  clinicSigns?: string[];
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
