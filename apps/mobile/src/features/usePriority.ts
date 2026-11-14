import { useMemo } from 'react';

import type { PriorityResult, SensorAggregate } from '../domain/entities';
import { priorityScore } from '../domain/priorityScore';
import { mergeWearable, simulateWearable } from '../domain/wearable';
import { useToday } from '../store/clock';
import { useData } from '../store/data';
import { useWearable } from '../store/wearable';

/** The phone's daily aggregates, plus the wearable's daily totals while one is connected. */
export function useSensorsWithWearable(): SensorAggregate[] {
  const checkIns = useData((s) => s.checkIns);
  const sensors = useData((s) => s.sensors);
  const connected = useWearable((s) => s.device !== null);
  const today = useToday();
  return useMemo(
    () => (connected ? mergeWearable(sensors, simulateWearable({ checkIns, sensors, today })) : sensors),
    [connected, checkIns, sensors, today],
  );
}

/** Current priority score from the patient's history (no perceived urgency). */
export function usePriority(): PriorityResult {
  const checkIns = useData((s) => s.checkIns);
  const sensors = useSensorsWithWearable();
  const bipolar = useData((s) => s.patient?.bipolarFlag ?? false);
  const today = useToday();
  return useMemo(() => priorityScore({ checkIns, sensors, today, flags: { bipolar } }), [checkIns, sensors, today, bipolar]);
}
