import { useMemo } from 'react';

import { emberLevel, emberState, type EmberState } from '../../domain/embers';
import { useToday } from '../../store/clock';
import { useData } from '../../store/data';

/** Ember intensity from self-care (never the priority score). */
export function useEmbers(): { level: number; state: EmberState } {
  const checkIns = useData((s) => s.checkIns);
  const sensors = useData((s) => s.sensors);
  const feedback = useData((s) => s.feedback);
  const today = useToday();
  return useMemo(() => {
    const level = emberLevel(checkIns, sensors, feedback, today);
    return { level, state: emberState(level) };
  }, [checkIns, sensors, feedback, today]);
}
