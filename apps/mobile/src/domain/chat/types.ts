import type { CompanionSpecies, EmotionId, InterventionId, PriorityLevel, Scale5 } from '../entities';
import type { OutreachLevel } from '../outreach';

/**
 * Chat messages store i18n keys (not rendered text), so the whole conversation
 * re-renders in the new language when the user switches it.
 */
export interface TextPart {
  key: string;
  params?: Record<string, string | number>;
}

export type ChatCard =
  | { type: 'mood' }
  | { type: 'emotions' }
  | { type: 'safety' }
  | { type: 'intervention'; id: InterventionId }
  | { type: 'plan' }
  | { type: 'insights' }
  | { type: 'consult' }
  | { type: 'crisis' }
  /** Saved journal entry; checkInId is filled in by the store after saving. */
  | { type: 'entry'; checkInId: string }
  /** One-tap call/message to the trusted person (or invite to add one). */
  | { type: 'friend' }
  /** After a long silence: calm ways to reconnect (not crisis language). */
  | { type: 'reconnect' }
  /** One PHQ item (1–9) with the four standard answers. */
  | { type: 'phq'; item: number }
  /** Invitation to the longer weekly check-in (sleep, energy, tap game). */
  | { type: 'weekly' };

export type InteractiveCard = 'mood' | 'emotions' | 'safety' | 'phq';

export type QuickReplyId = 'checkin' | 'relax' | 'low' | 'anxious' | 'progress' | 'care' | 'plan' | 'skip' | 'phq' | 'notNow';

export interface ChatMessage {
  id: string;
  role: 'user' | 'companion';
  createdAt: string;
  /** Free text typed by the user. */
  text?: string;
  /** Translatable content. */
  parts?: TextPart[];
  /** Separator used to join parts (default: a space). */
  joiner?: string;
  card?: ChatCard;
  quickReplies?: QuickReplyId[];
  /** Written by the optional AI companion (shown with a small label). */
  ai?: boolean;
}

export type NewChatMessage = Omit<ChatMessage, 'id' | 'createdAt'>;

export type ChatStep = 'idle' | 'mood' | 'emotions' | 'note' | 'safety' | 'phq';

export interface ChatDraft {
  mood?: Scale5;
  emotions: EmotionId[];
  note?: string;
}

export interface ChatFlowState {
  step: ChatStep;
  draft: ChatDraft;
  /** How many times the user asked for something calming (to rotate options). */
  relaxCount: number;
  /** Daily moment: one mood tap is the whole check-in (no feelings / note steps). */
  daily?: boolean;
  /** PHQ answers so far (items 1..n). */
  phq?: number[];
}

export const INITIAL_FLOW: ChatFlowState = { step: 'idle', draft: { emotions: [] }, relaxCount: 0 };

/** Everything the engine needs to know about the patient right now. */
export interface ChatContext {
  companionName: string;
  species: CompanionSpecies;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  lastMood?: Scale5;
  daysSinceLastCheckIn?: number;
  daylightHours: number;
  checkedInToday: boolean;
  priorityLevel: PriorityLevel;
  hasOpenRequest: boolean;
  /** Best next small action (from today's plan / bandit). */
  suggestedIntervention: InterventionId;
  /** Calming options ordered by what helped this user most. */
  calmInterventions: InterventionId[];
  /** Silence ladder level (days without check-in). */
  outreach: OutreachLevel;
  /** Name of the trusted person, if the user added one. */
  trustedContactName?: string;
  /** Clinic-flagged upward drift: never praise, keep a calm, sleep-protecting tone. */
  upwardDrift: boolean;
  /** Priority ≥ medium and no questionnaire this week → reach out with the two questions. */
  phqDue: boolean;
  /** Recent PHQ-9 ≥ 10: only then the companion suggests the care team (questionnaires decide). */
  phqConcern: boolean;
  /** No full check-in in the last 7 days → invite the longer weekly one. */
  weeklyDue: boolean;
  /** Clinic-only status: care ended → no outreach, no questions, no suggestions. */
  careEnded: boolean;
}

export type ChatEvent =
  | { type: 'phq'; value: number }
  | { type: 'open' }
  | { type: 'text'; text: string }
  | { type: 'quick'; id: QuickReplyId }
  | { type: 'mood'; mood: Scale5 }
  | { type: 'emotions'; emotions: EmotionId[] }
  | { type: 'safety'; answer: boolean };

export type ChatEffect =
  | { type: 'saveCheckIn'; mood: Scale5; emotions: EmotionId[]; note?: string; safetyConcern: boolean }
  | { type: 'raiseAlert' }
  /** 2 items = PHQ-2 only, 9 items = full PHQ-9. */
  | { type: 'savePhq'; items: number[] };

export interface EngineResult {
  messages: NewChatMessage[];
  flow: ChatFlowState;
  effects: ChatEffect[];
}
