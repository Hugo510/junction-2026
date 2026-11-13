import { addDaysISO, toISODate, type ISODate } from '../domain/dates';
import { useSettings } from './settings';

/** Current time. The demo "Advance 1 day" shifts the calendar date, not the clock time. */
export function now(): Date {
  const d = new Date();
  d.setDate(d.getDate() + useSettings.getState().dayOffset);
  return d;
}

export function todayISO(): ISODate {
  return toISODate(now());
}

export function yesterdayISO(): ISODate {
  return addDaysISO(todayISO(), -1);
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export function timeOfDay(d: Date = new Date()): TimeOfDay {
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

/** Hook version so screens re-render when the simulated day changes. */
export function useToday(): ISODate {
  const offset = useSettings((s) => s.dayOffset);
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toISODate(d);
}
