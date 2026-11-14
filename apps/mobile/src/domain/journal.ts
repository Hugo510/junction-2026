import { addDaysISO, lastNDates, toISODate, type ISODate } from './dates';
import type { CheckIn, EmotionId } from './entities';

/**
 * Emotional journal. Every check-in (full, chat or journal) is a journal entry.
 * Consistency is shown kindly: "days noticed" only grows and never resets.
 */
export type EmotionValence = 'pleasant' | 'difficult';

export const EMOTIONS: readonly { id: EmotionId; emoji: string; valence: EmotionValence }[] = [
  { id: 'calm', emoji: '😌', valence: 'pleasant' },
  { id: 'content', emoji: '🙂', valence: 'pleasant' },
  { id: 'grateful', emoji: '🙏', valence: 'pleasant' },
  { id: 'hopeful', emoji: '🌱', valence: 'pleasant' },
  { id: 'proud', emoji: '⭐', valence: 'pleasant' },
  { id: 'tired', emoji: '😴', valence: 'difficult' },
  { id: 'sad', emoji: '😢', valence: 'difficult' },
  { id: 'anxious', emoji: '😟', valence: 'difficult' },
  { id: 'irritable', emoji: '😤', valence: 'difficult' },
  { id: 'lonely', emoji: '😔', valence: 'difficult' },
  { id: 'overwhelmed', emoji: '😣', valence: 'difficult' },
  { id: 'numb', emoji: '😶', valence: 'difficult' },
];

export const emotionEmoji = (id: EmotionId): string => EMOTIONS.find((e) => e.id === id)?.emoji ?? '•';

/** Distinct days with at least one entry. Never decreases. */
export function daysLogged(checkIns: CheckIn[]): number {
  return new Set(checkIns.map((c) => c.date)).size;
}

export const MILESTONES = [1, 3, 7, 14, 30] as const;

export function milestones(checkIns: CheckIn[]): { days: number; unlocked: boolean }[] {
  const total = daysLogged(checkIns);
  return MILESTONES.map((days) => ({ days, unlocked: total >= days }));
}

/** How often each feeling was noted in the last `days` days (most frequent first). */
export function emotionCounts(checkIns: CheckIn[], today: ISODate, days = 14): { id: EmotionId; count: number }[] {
  const window = new Set(lastNDates(today, days));
  const counts = new Map<EmotionId, number>();
  for (const c of checkIns) {
    if (!window.has(c.date)) continue;
    for (const e of c.emotions ?? []) counts.set(e, (counts.get(e) ?? 0) + 1);
  }
  return [...counts.entries()].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count);
}

/** Entries grouped by date, newest first inside each day. */
export function entriesByDate(checkIns: CheckIn[]): Map<ISODate, CheckIn[]> {
  const map = new Map<ISODate, CheckIn[]>();
  for (const c of [...checkIns].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    map.set(c.date, [...(map.get(c.date) ?? []), c]);
  }
  return map;
}

/** Calendar weeks (Monday first) for a month; null = padding cell. */
export function monthGrid(year: number, monthIndex: number): (ISODate | null)[][] {
  const first = new Date(year, monthIndex, 1, 12);
  const daysInMonth = new Date(year, monthIndex + 1, 0, 12).getDate();
  const offset = (first.getDay() + 6) % 7; // Monday = 0
  const cells: (ISODate | null)[] = Array.from({ length: offset }, () => null);
  const start = toISODate(first);
  for (let i = 0; i < daysInMonth; i++) cells.push(addDaysISO(start, i));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (ISODate | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
