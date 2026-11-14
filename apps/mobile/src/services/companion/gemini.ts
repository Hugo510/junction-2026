import { MockCompanionService } from './mock';
import type { CompanionService } from './types';

/**
 * PREPARED, NOT IMPLEMENTED.
 *
 * Future companion powered by an LLM. It will call OUR backend
 * (POST {EXPO_PUBLIC_API_URL}/v1/companion/...), which holds the model API key
 * and applies safety filters. The key must never live in the app bundle.
 *
 * Until then it delegates to the mock so the app always works offline.
 */
export class GeminiCompanionService implements CompanionService {
  private readonly fallback = new MockCompanionService();

  constructor(private readonly baseUrl: string = process.env.EXPO_PUBLIC_API_URL ?? '') {}

  getGreeting: CompanionService['getGreeting'] = (ctx) => this.fallback.getGreeting(ctx);
  respondToCheckIn: CompanionService['respondToCheckIn'] = (c, r, ctx) => this.fallback.respondToCheckIn(c, r, ctx);
  encourage: CompanionService['encourage'] = (m, ctx) => this.fallback.encourage(m, ctx);

  /** Placeholder so the configured URL is visible during debugging. */
  get endpoint(): string {
    return `${this.baseUrl}/v1/companion`;
  }
}
