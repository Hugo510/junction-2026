import type { CheckIn, PriorityResult } from './entities';
import { matchesAny } from './text';

/**
 * Risk rules. Deliberately simple and conservative:
 * - A "yes" to the safety question ALWAYS means "urgent", regardless of any score.
 * - Free text (chat messages, journal notes) that contains crisis language is also "urgent".
 *   False positives are acceptable here; false negatives are not.
 * - Urgent cases never go through the normal consultation queue: they are routed
 *   to the urgent channel (crisis screen + urgent alert for the care team).
 *
 * The app does not diagnose; this only decides how fast humans must be involved.
 */
export type RiskLevel = 'none' | 'urgent';

export interface RiskAssessment {
  level: RiskLevel;
  reasons: string[];
}

/** Normalized crisis phrases in English, Finnish, Spanish and Swedish (see text.ts syntax). */
export const CRISIS_KEYWORDS: readonly string[] = [
  // en
  'kill myself', 'suicid*', 'end my life', 'end it all', 'hurt myself', 'harm myself', 'self harm',
  'want to die', 'wanna die', 'dont want to live', 'no reason to live', 'better off dead',
  // es
  'matarme', 'quitarme la vida', 'hacerme dano', 'lastimarme', 'no quiero vivir', 'quiero morir',
  'quiero morirme', 'acabar con mi vida', 'acabar con todo', 'autolesion*',
  // fi
  'itsemurha*', 'tappaa itseni', 'tapan itseni', 'satuttaa itseani', 'vahingoittaa itseani',
  'haluan kuolla', 'en halua elaa', 'itsetuho*',
  // sv
  'sjalvmord*', 'ta livet av mig', 'skada mig sjalv', 'vill do', 'vill inte leva', 'sjalvskad*',
];

export function detectCrisisLanguage(text: string | undefined): boolean {
  return !!text && matchesAny(text, CRISIS_KEYWORDS);
}

export function assessCheckInRisk(checkIn: Pick<CheckIn, 'safetyConcern'> & { note?: string }): RiskAssessment {
  const reasons: string[] = [];
  if (checkIn.safetyConcern) reasons.push('risk.reasons.safetyAnswer');
  if (detectCrisisLanguage(checkIn.note)) reasons.push('risk.reasons.crisisLanguage');
  return reasons.length > 0 ? { level: 'urgent', reasons } : { level: 'none', reasons };
}

export function assessTextRisk(text: string): RiskAssessment {
  return detectCrisisLanguage(text)
    ? { level: 'urgent', reasons: ['risk.reasons.crisisLanguage'] }
    : { level: 'none', reasons: [] };
}

export type CareChannel = 'urgent' | 'normalQueue';

/** The priority score can never downgrade an urgent risk. */
export function routeToChannel(risk: RiskAssessment, _priority?: PriorityResult): CareChannel {
  return risk.level === 'urgent' ? 'urgent' : 'normalQueue';
}
