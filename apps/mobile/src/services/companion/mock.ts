import { checkInResponseKey, greetingParts } from '../../domain/chat/messages';
import i18n from '../../i18n';
import type { CompanionContext, CompanionService } from './types';

/**
 * Template-based companion. Each species has a light personality (the bee is energetic,
 * the cat calm, the dog enthusiastic, the bird playful, the person steady) and every
 * message is rendered in the active language. The conversation logic lives in
 * src/domain/chat (pure and tested); this service renders the same keys as text.
 */
export class MockCompanionService implements CompanionService {
  private t(ctx: CompanionContext) {
    return i18n.getFixedT(ctx.language);
  }

  async getGreeting(ctx: CompanionContext): Promise<string> {
    const t = this.t(ctx);
    return greetingParts({ ...ctx, species: ctx.companion.species })
      .map((p) => t(p.key, p.params ?? {}))
      .join(' ');
  }

  async respondToCheckIn(...[checkIn, risk, ctx]: Parameters<CompanionService['respondToCheckIn']>): Promise<string> {
    return this.t(ctx)(checkInResponseKey(checkIn.mood, risk.level === 'urgent'));
  }

  async encourage(...[moment, ctx]: Parameters<CompanionService['encourage']>): Promise<string> {
    const t = this.t(ctx);
    if (moment === 'keepGoing') return t(`companion.encourage.keepGoing.${ctx.companion.species}`);
    return t(`companion.encourage.${moment}`);
  }
}
