import { useMemo, useState } from 'react';

import { parseISODate, type ISODate } from '../../domain/dates';
import type { Scale5 } from '../../domain/entities';
import { daysLogged, emotionCounts, entriesByDate, milestones } from '../../domain/journal';
import { useToday } from '../../store/clock';
import { useData } from '../../store/data';

/** View model for the journal: kind stats, calendar state and visible entries (no UI here). */
export function useJournalViewModel() {
  const today = useToday();
  const checkIns = useData((s) => s.checkIns);
  const companionName = useData((s) => s.patient?.companion.name ?? '');
  const todayDate = parseISODate(today);
  const [cursor, setCursor] = useState({ year: todayDate.getFullYear(), month: todayDate.getMonth() });
  const [selected, setSelected] = useState<ISODate | null>(null);

  const stats = useMemo(() => {
    const byDate = entriesByDate(checkIns);
    const moodByDate = new Map<ISODate, Scale5>();
    byDate.forEach((entries, date) => moodByDate.set(date, entries[0].mood));
    return {
      total: daysLogged(checkIns),
      badges: milestones(checkIns),
      topEmotions: emotionCounts(checkIns, today).slice(0, 6),
      byDate,
      moodByDate,
    };
  }, [checkIns, today]);

  const visibleDays = selected ? [selected] : [...stats.byDate.keys()].slice(0, 10);

  return {
    ...stats,
    today,
    companionName,
    isEmpty: checkIns.length === 0,
    cursor,
    selected,
    visibleDays,
    shiftMonth: (delta: number) =>
      setCursor(({ year, month }) => {
        const d = new Date(year, month + delta, 1);
        return { year: d.getFullYear(), month: d.getMonth() };
      }),
    toggleDay: (d: ISODate) => setSelected((cur) => (cur === d ? null : d)),
  };
}
