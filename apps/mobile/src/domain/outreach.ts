import { daysBetween, type ISODate } from './dates';
import type { Alert, CheckIn } from './entities';

/**
 * "Hiillos is active": when someone goes quiet, the app reaches out first and climbs a gentle ladder.
 *
 *   ≥ 2 silent days → warm      : a warmer, no-pressure message
 *   ≥ 4 silent days → friend    : suggest the trusted person (one-tap call / message)
 *   ≥ 7 silent days → reconnect : "we lost touch, here's how to reach us" (NOT crisis language),
 *                                 at most ONE gentle message a week; the care team is told only
 *                                 if the person consented at onboarding
 *   ≥ 30 silent days → quiet    : the ladder stops (account dormant). No endless "we miss you".
 *
 * Silence is not relapse and not death: the app never guesses. Only the clinic can set
 * "care ended", which stops all outreach at once. Hiillos never contacts the trusted person
 * by itself, and 112 is never part of this ladder (safety path only).
 */
export type OutreachLevel = 'none' | 'warm' | 'friend' | 'reconnect' | 'quiet';

export const SILENCE_DAYS = { warm: 2, friend: 4, reconnect: 7, quiet: 30 } as const;
/** Don't notify the care team again within this many days. */
export const SILENCE_ALERT_COOLDOWN_DAYS = 7;

/** Days since the last entry; null when there is no history at all (new user ≠ silent user). */
export function daysSilent(checkIns: CheckIn[], today: ISODate): number | null {
  if (checkIns.length === 0) return null;
  const last = checkIns.reduce((max, c) => (c.date > max ? c.date : max), checkIns[0].date);
  return Math.max(0, daysBetween(last, today));
}

export function outreachLevel(checkIns: CheckIn[], today: ISODate): OutreachLevel {
  const days = daysSilent(checkIns, today);
  if (days === null) return 'none';
  if (days >= SILENCE_DAYS.quiet) return 'quiet';
  if (days >= SILENCE_DAYS.reconnect) return 'reconnect';
  if (days >= SILENCE_DAYS.friend) return 'friend';
  if (days >= SILENCE_DAYS.warm) return 'warm';
  return 'none';
}

export type NoticeKind = 'daily' | 'evening' | 'warm' | 'friend' | 'reconnect' | 'drift';

export interface NoticeInput {
  level: OutreachLevel;
  /** From daysSilent(); used to send "reconnect" only once a week. */
  daysSilent: number | null;
  checkedInToday: boolean;
  /** Signals drifted (priority at least medium): two quick questions. Never a clinic alert by itself. */
  drift: boolean;
  /** Clinic-only status: stops all outreach. */
  careEnded: boolean;
}

/** Which "reaches out first" notification to send today, or null for none. */
export function noticeFor(input: NoticeInput): NoticeKind | null {
  if (input.careEnded || input.level === 'quiet') return null;
  if (input.level === 'reconnect') {
    const sinceReconnect = (input.daysSilent ?? SILENCE_DAYS.reconnect) - SILENCE_DAYS.reconnect;
    return sinceReconnect % 7 === 0 ? 'reconnect' : null;
  }
  if (input.level === 'friend' || input.level === 'warm') return input.level;
  if (input.drift) return 'drift';
  return input.checkedInToday ? 'evening' : 'daily';
}

/** i18n key of the full notification text (shown only when discreet notifications are off). */
export function noticeTextKey(kind: NoticeKind, hasTrustedContact: boolean): string {
  if (kind === 'friend') return hasTrustedContact ? 'notify.friend' : 'notify.friendNoContact';
  return `notify.${kind}`;
}

/** Should we (simulated) tell the care team that we lost touch? Consent + cooldown required. */
export function shouldNotifyCareTeam(
  level: OutreachLevel,
  consent: boolean,
  alerts: Pick<Alert, 'source' | 'createdAt'>[],
  today: ISODate,
): boolean {
  if (level !== 'reconnect' || !consent) return false;
  return !alerts.some(
    (a) => a.source === 'silence' && daysBetween(a.createdAt.slice(0, 10), today) < SILENCE_ALERT_COOLDOWN_DAYS,
  );
}
