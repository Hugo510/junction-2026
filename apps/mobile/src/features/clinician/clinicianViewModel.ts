import type { Persona } from '../../data/personas';
import type { ISODate } from '../../domain/dates';
import { daysBetween } from '../../domain/dates';
import type { EarlySign, Phq9Entry } from '../../domain/entities';
import { outreachLevel } from '../../domain/outreach';
import { latestPhq } from '../../domain/phq';
import { priorityScore } from '../../domain/priorityScore';

export type CallStatus = 'review' | 'pending' | 'notIndicated';

/** BUILD_SPEC §7: >=15 immediately, or >=10 AND +5 vs a documented personal
 * PHQ baseline on two checks 7–14 days apart. Baseline is NOT inferred from the
 * first/minimum questionnaire: existing personas do not identify a clinical baseline.
 * Priority and hasPhqConcern are deliberately not used for call-list membership.
 */
export function callStatus(entries: Phq9Entry[], today: ISODate, baseline?: number): CallStatus {
  const full = entries.filter((e) => e.date <= today && (e.kind ?? 'phq9') === 'phq9');
  const last = latestPhq(full, true);
  if (!last) return 'pending';
  if (last.total >= 15) return 'review';
  if (last.total < 10) return 'notIndicated';
  if (baseline === undefined) return 'pending';
  if (last.total - baseline < 5) return 'notIndicated';
  const confirmed = full.some((e) => {
    const gap = daysBetween(e.date, last.date);
    return gap >= 7 && gap <= 14 && e.total >= 10 && e.total - baseline >= 5;
  });
  return confirmed ? 'review' : 'pending';
}

/** Read-only projection. Reasons keep priorityScore's explicit rule-evaluation
 * order (mood change, baseline, low mood, missed entries, activity, reaction,
 * sleep, anxiety, perceived urgency, upward drift), NOT a ranking by weight.
 * No store, repositories, alerts or loadPersona calls belong in this module.
 */
export function buildClinicianRows(personas: readonly Persona[], today: ISODate, earlySigns: Readonly<Record<string, readonly EarlySign[]>> = {}) {
  return personas.map((persona) => {
    const checkIns = persona.checkIns.filter((c) => c.date <= today);
    const sensors = persona.sensors.filter((s) => s.date <= today);
    const phq = (persona.phq9 ?? []).filter((q) => q.date <= today);
    const latest = latestPhq(phq, true);
    const outreach = outreachLevel(checkIns, today);
    // Early signs are set by the clinic per person; they only reorder the reasons.
    const watchedSigns = earlySigns[persona.persona.id] ?? [];
    const priority = priorityScore({ checkIns, sensors, today, flags: { bipolar: persona.persona.bipolarFlag, earlySigns: watchedSigns } });
    return {
      id: persona.persona.id,
      name: persona.persona.label.split(',')[0].trim(),
      priority,
      reasons: priority.reasons.slice(0, 2),
      watchedSigns,
      latestPhq9: latest,
      // Quiet stops outreach; it does not mean contact has resumed.
      outreach,
      lostContact: outreach === 'reconnect' || outreach === 'quiet',
      callStatus: callStatus(phq, today),
      // Only explicit safety answers, never a sensor score. This is a historical
      // record indicator, not an assertion that an unresolved emergency exists now.
      safetyRecorded: checkIns.some((c) => c.safetyConcern) || phq.some((q) => q.items[8] > 0),
    };
  }).sort((a, b) => b.priority.score - a.priority.score || a.name.localeCompare(b.name));
}
export type ClinicianRow = ReturnType<typeof buildClinicianRows>[number];
