import { useMemo } from 'react';

import type { PriorityResult } from '../domain/entities';
import { priorityScore } from '../domain/priorityScore';
import { useToday } from '../store/clock';
import { useData } from '../store/data';

/** Current priority score from the patient's history (no perceived urgency). */
export function usePriority(): PriorityResult {
  const checkIns = useData((s) => s.checkIns);
  const sensors = useData((s) => s.sensors);
  const bipolar = useData((s) => s.patient?.bipolarFlag ?? false);
  const today = useToday();
  return useMemo(() => priorityScore({ checkIns, sensors, today, flags: { bipolar } }), [checkIns, sensors, today, bipolar]);
}
