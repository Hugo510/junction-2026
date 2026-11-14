import { useMemo } from 'react';

import type { ChatContext } from '../../domain/chat/types';
import { simulateQueueProgress } from '../../domain/consultQueue';
import { daysBetween } from '../../domain/dates';
import { DEFAULT_LATITUDE, daylightHours } from '../../domain/daylight';
import type { InterventionId } from '../../domain/entities';
import { checkInsByDate } from '../../domain/history';
import { getIntervention, INTERVENTION_IDS } from '../../domain/interventions';
import { rankInterventions } from '../../domain/interventionPicker';
import { outreachLevel } from '../../domain/outreach';
import { hasPhqConcern, isPhqDue } from '../../domain/phq';
import { detectUpwardDrift } from '../../domain/priorityScore';
import { now, timeOfDay, useToday } from '../../store/clock';
import { useData } from '../../store/data';
import { useSettings } from '../../store/settings';
import { usePriority } from '../usePriority';

/** Snapshot of the patient's situation for the chat engine. */
export function useChatContext(): ChatContext | null {
  const patient = useData((s) => s.patient);
  const checkIns = useData((s) => s.checkIns);
  const feedback = useData((s) => s.feedback);
  const plan = useData((s) => s.plan);
  const requests = useData((s) => s.requests);
  const sensors = useData((s) => s.sensors);
  const phq9 = useData((s) => s.phq9);
  const trusted = useSettings((s) => s.trustedContact);
  const priority = usePriority();
  const today = useToday();

  return useMemo(() => {
    if (!patient) return null;
    const previous = [...checkInsByDate(checkIns).values()]
      .filter((c) => c.date < today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .pop();
    const ranking = rankInterventions(INTERVENTION_IDS, feedback, checkIns).map((r) => r.id);
    const calm = ranking.filter((id) => getIntervention(id).tags.some((tag) => tag === 'calm' || tag === 'focus'));
    const pending = plan?.items.find((i) => i.status === 'pending')?.interventionId;
    const current = now();
    return {
      companionName: patient.companion.name,
      species: patient.companion.species,
      timeOfDay: timeOfDay(),
      lastMood: previous?.mood,
      daysSinceLastCheckIn: previous ? daysBetween(previous.date, today) : undefined,
      daylightHours: daylightHours(DEFAULT_LATITUDE, current),
      checkedInToday: checkIns.some((c) => c.date === today),
      priorityLevel: priority.level,
      hasOpenRequest: requests.some(
        (r) => simulateQueueProgress(r.initialPosition, new Date(r.createdAt), current).status === 'queued',
      ),
      suggestedIntervention: (pending ?? ranking[0]) as InterventionId,
      calmInterventions: calm,
      outreach: outreachLevel(checkIns, today),
      trustedContactName: trusted?.name,
      upwardDrift: !!patient.bipolarFlag && detectUpwardDrift({ checkIns, sensors, today }),
      phqDue: isPhqDue(priority.level, phq9, today),
      phqConcern: hasPhqConcern(phq9, today),
      weeklyDue: !checkIns.some((c) => (c.kind ?? 'full') === 'full' && daysBetween(c.date, today) < 7),
    };
  }, [patient, checkIns, sensors, phq9, feedback, plan, requests, priority.level, today, trusted]);
}
