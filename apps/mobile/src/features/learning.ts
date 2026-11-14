import { useMemo } from 'react';

import { demoPopulationPriors } from '../data/personas/population';
import type { InterventionId } from '../domain/entities';
import type { ArmPriors } from '../domain/interventionPicker';
import { bodyResponse, respondsWell } from '../domain/bodyResponse';
import { useData } from '../store/data';
import { useSettings } from '../store/settings';
import { useSensorsWithWearable } from './usePriority';

const NONE: ArmPriors = {};

/** Starting points from other people, only when the person agreed to it (Privacy screen). */
export function usePopulationPriors(): ArmPriors {
  const on = useSettings((s) => s.sharedLearning);
  return useMemo(() => (on ? demoPopulationPriors() : NONE), [on]);
}

/** The action that helped other people most (null when sharing is off or nothing stands out). */
export function usePopulationHelp(): InterventionId | null {
  const priors = usePopulationPriors();
  return useMemo(() => {
    const best = (Object.entries(priors) as [InterventionId, number][]).sort((a, b) => b[1] - a[1])[0];
    return best && best[1] > 0.3 ? best[0] : null;
  }, [priors]);
}

/** true when the nights after this step were better than the person's own usual (body loop, B4). */
export function useBodyReason(id: InterventionId | null): boolean {
  const feedback = useData((s) => s.feedback);
  const sensors = useSensorsWithWearable();
  return useMemo(() => (id ? respondsWell(bodyResponse(id, feedback, sensors)) : false), [id, feedback, sensors]);
}
