import { useMemo } from 'react';
import { PERSONAS } from '../../data/personas';
import { addDaysISO } from '../../domain/dates';
import { useSettings } from '../../store/settings';
import { buildClinicianRows } from './clinicianViewModel';

/** Fixed fixture calendar: do not rebase each patient independently (Sara's
 * silence must remain visible). Demo day controls move this common reference. */
export function useClinicianViewModel() {
  const offset = useSettings((s) => s.dayOffset);
  const date = addDaysISO('2026-11-15', offset);
  const rows = useMemo(() => buildClinicianRows(PERSONAS, date), [date]);
  return { rows, date };
}
