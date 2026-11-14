import type { ReactionAggregate } from '../../domain/entities';
import { summarizeReaction } from '../../domain/reaction';

/**
 * Collects one reaction game in memory. Only the aggregate leaves this object;
 * individual tap times are discarded when the session ends.
 */
export class ReactionSession {
  private hits: number[] = [];
  private played = 0;
  private glowAt: number | null = null;

  constructor(readonly rounds = 8) {}

  get round(): number {
    return this.played;
  }

  get finished(): boolean {
    return this.played >= this.rounds;
  }

  markGlow(at: number = Date.now()): void {
    this.glowAt = at;
  }

  /** Returns the reaction time, or null if the tap came before the glow. */
  tap(at: number = Date.now()): number | null {
    const glow = this.glowAt;
    this.played += 1;
    this.glowAt = null;
    if (glow === null) return null;
    const ms = at - glow;
    this.hits.push(ms);
    return ms;
  }

  summary(): ReactionAggregate {
    const result = summarizeReaction(this.hits, this.played);
    this.hits = [];
    return result;
  }
}
