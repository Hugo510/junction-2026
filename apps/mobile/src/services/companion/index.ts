import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { daysBetween } from '../../domain/dates';
import { DEFAULT_LATITUDE, daylightHours } from '../../domain/daylight';
import { checkInsByDate } from '../../domain/history';
import { currentLanguage } from '../../i18n';
import { now, timeOfDay, todayISO } from '../../store/clock';
import { useData } from '../../store/data';
import { MockCompanionService } from './mock';
import type { CompanionContext, CompanionService } from './types';

export type { CompanionContext, CompanionService, EncourageMoment } from './types';

/** Swap for GeminiCompanionService once the backend endpoint exists. */
export const companionService: CompanionService = new MockCompanionService();

/** Builds the companion context from the current app state. */
export function useCompanionContext(): CompanionContext | null {
  const { i18n } = useTranslation();
  const patient = useData((s) => s.patient);
  const checkIns = useData((s) => s.checkIns);
  if (!patient) return null;

  const today = todayISO();
  const previous = [...checkInsByDate(checkIns).values()]
    .filter((c) => c.date < today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .pop();

  return {
    companion: patient.companion,
    language: (i18n.language as CompanionContext['language']) ?? currentLanguage(),
    timeOfDay: timeOfDay(),
    lastMood: previous?.mood,
    daysSinceLastCheckIn: previous ? daysBetween(previous.date, today) : undefined,
    daylightHours: daylightHours(DEFAULT_LATITUDE, now()),
  };
}

/** Async companion message with a stable fallback while loading. */
export function useCompanionMessage(
  build: (svc: CompanionService, ctx: CompanionContext) => Promise<string>,
  deps: unknown[],
): string | null {
  const ctx = useCompanionContext();
  const [message, setMessage] = useState<string | null>(null);
  const key = ctx ? `${ctx.language}|${ctx.companion.species}|${ctx.lastMood}|${ctx.daysSinceLastCheckIn}|${ctx.timeOfDay}` : '';
  useEffect(() => {
    if (!ctx) return;
    let alive = true;
    build(companionService, ctx).then((m) => alive && setMessage(m)).catch(() => undefined);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ...deps]);
  return message;
}
