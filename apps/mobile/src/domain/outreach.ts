import { daysBetween, type ISODate } from './dates';
import type { Alert, CheckIn } from './entities';

/**
 * "Hiillos is active": when someone goes quiet, the app reaches out first and climbs a gentle ladder.
 *
 *   ≥ 2 silent days → warm   : a warmer, no-pressure message
 *   ≥ 4 silent days → friend : suggest the trusted person (one-tap call / message)
 *   ≥ 7 silent days → reconnect : "we lost touch, here's how to reach us" (NOT crisis language);
 *                     the care team is told ONLY if the person consented at onboarding.
 *
 * 112 is never part of this ladder: it only appears on the safety path.
 */
export type OutreachLevel = 'none' | 'warm' | 'friend' | 'reconnect';

export const SILENCE_DAYS = { warm: 2, friend: 4, reconnect: 7 } as const;
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
  if (days >= SILENCE_DAYS.reconnect) return 'reconnect';
  if (days >= SILENCE_DAYS.friend) return 'friend';
  if (days >= SILENCE_DAYS.warm) return 'warm';
  return 'none';
}

/** i18n key of the "reaches out first" notification for the current situation. */
export function notificationKey(level: OutreachLevel, checkedInToday: boolean, hasTrustedContact: boolean): string {
  if (level === 'reconnect') return 'notify.reconnect';
  if (level === 'friend') return hasTrustedContact ? 'notify.friend' : 'notify.friendNoContact';
  if (level === 'warm') return 'notify.warm';
  return checkedInToday ? 'notify.evening' : 'notify.daily';
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
