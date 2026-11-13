import type { CheckIn, PriorityResult } from './entities';

/**
 * Risk rules. Deliberately simple and conservative:
 * - A "yes" to the safety question ALWAYS means "urgent", regardless of any score.
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

export function assessCheckInRisk(checkIn: Pick<CheckIn, 'safetyConcern'>): RiskAssessment {
  if (checkIn.safetyConcern) {
    return { level: 'urgent', reasons: ['risk.reasons.safetyAnswer'] };
  }
  return { level: 'none', reasons: [] };
}

export type CareChannel = 'urgent' | 'normalQueue';

/** The priority score can never downgrade an urgent risk. */
export function routeToChannel(risk: RiskAssessment, _priority?: PriorityResult): CareChannel {
  return risk.level === 'urgent' ? 'urgent' : 'normalQueue';
}
