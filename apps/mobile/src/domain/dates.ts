/** Calendar date in local time, formatted as YYYY-MM-DD. */
export type ISODate = string;

const pad = (n: number): string => (n < 10 ? `0${n}` : String(n));

export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parses an ISODate at local noon (avoids DST edge cases). */
export function parseISODate(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function addDaysISO(s: ISODate, days: number): ISODate {
  const d = parseISODate(s);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Whole days from `a` to `b` (b - a). */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / 86_400_000);
}

/** The `n` dates ending at `end` (inclusive), oldest first. */
export function lastNDates(end: ISODate, n: number): ISODate[] {
  return Array.from({ length: n }, (_, i) => addDaysISO(end, i - (n - 1)));
}

export function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}
