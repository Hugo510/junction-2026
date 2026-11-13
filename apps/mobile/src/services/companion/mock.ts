import i18n from '../../i18n';
import type { CompanionContext, CompanionService } from './types';

/**
 * Template-based companion. Each species has a light personality (the bee is energetic,
 * the cat calm, the dog enthusiastic, the bird playful, the person steady) and every
 * message is rendered in the active language.
 */
export class MockCompanionService implements CompanionService {
  private t(ctx: CompanionContext) {
    return i18n.getFixedT(ctx.language);
  }

  async getGreeting(ctx: CompanionContext): Promise<string> {
    const t = this.t(ctx);
    const first = `${t(`companion.greeting.${ctx.timeOfDay}`)} ${t(`companion.voice.${ctx.companion.species}`)}`;

    let context: string;
    if (ctx.daysSinceLastCheckIn !== undefined && ctx.daysSinceLastCheckIn >= 2) {
      context = t('companion.context.welcomeBack');
    } else if (ctx.timeOfDay === 'night') {
      context = t('companion.context.night');
    } else if (ctx.lastMood !== undefined && ctx.lastMood <= 2) {
      context = t('companion.context.lowMood');
    } else if (ctx.daylightHours < 9 && ctx.timeOfDay !== 'evening') {
      context = t('companion.context.daylight');
    } else if (ctx.lastMood === undefined) {
      context = t('companion.context.noMood');
    } else {
      context = t(ctx.lastMood >= 4 ? 'companion.context.highMood' : 'companion.context.midMood');
    }
    return `${first} ${context}`;
  }

  async respondToCheckIn(checkIn: Parameters<CompanionService['respondToCheckIn']>[0], risk: Parameters<CompanionService['respondToCheckIn']>[1], ctx: CompanionContext): Promise<string> {
    const t = this.t(ctx);
    if (risk.level === 'urgent') return t('companion.checkin.urgent');
    if (checkIn.mood <= 2) return t('companion.checkin.low');
    if (checkIn.mood === 3) return t('companion.checkin.mid');
    return t('companion.checkin.high');
  }

  async encourage(moment: Parameters<CompanionService['encourage']>[0], ctx: CompanionContext): Promise<string> {
    const t = this.t(ctx);
    if (moment === 'keepGoing') return t(`companion.encourage.keepGoing.${ctx.companion.species}`);
    return t(`companion.encourage.${moment}`);
  }
}
