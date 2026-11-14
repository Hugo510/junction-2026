import type { CheckIn, Companion, Scale5, SupportedLanguage } from '../../domain/entities';
import type { RiskAssessment } from '../../domain/riskRules';
import type { TimeOfDay } from '../../store/clock';

export interface CompanionContext {
  companion: Companion;
  language: SupportedLanguage;
  timeOfDay: TimeOfDay;
  /** Mood of the most recent previous check-in. */
  lastMood?: Scale5;
  /** Days since the last check-in (undefined = never). */
  daysSinceLastCheckIn?: number;
  daylightHours: number;
}

export type EncourageMoment = 'start' | 'keepGoing' | 'gentle' | 'done';

/**
 * The companion is a supportive voice only. Implementations must NEVER diagnose,
 * give treatment advice, or replace professionals; on risk they point to help.
 */
export interface CompanionService {
  getGreeting(ctx: CompanionContext): Promise<string>;
  respondToCheckIn(checkIn: CheckIn, risk: RiskAssessment, ctx: CompanionContext): Promise<string>;
  encourage(moment: EncourageMoment, ctx: CompanionContext): Promise<string>;
}
