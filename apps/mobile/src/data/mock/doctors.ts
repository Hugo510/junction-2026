import type { Doctor } from '../../domain/entities';

/** FICTIONAL care team. Any resemblance to real people is coincidental. */
const TEAM: Omit<Doctor, 'slots'>[] = [
  { id: 'doc-1', name: 'Dr. Aava Lindqvist', role: 'psychiatrist', languages: ['fi', 'sv', 'en'] },
  { id: 'doc-2', name: 'Eero Mäkelä', role: 'nurse', languages: ['fi', 'en'] },
  { id: 'doc-3', name: 'Lucía Romero', role: 'psychologist', languages: ['es', 'en', 'fi'] },
];

/** Offsets (hours from now) of simulated free slots in the next 48 h. */
const SLOT_OFFSETS: Record<string, number[]> = {
  'doc-1': [20, 44],
  'doc-2': [3, 6, 27],
  'doc-3': [9, 31, 46],
};

export function mockDoctors(now: Date): Doctor[] {
  const base = new Date(now);
  base.setMinutes(0, 0, 0);
  return TEAM.map((d) => ({
    ...d,
    slots: (SLOT_OFFSETS[d.id] ?? []).map((h) => new Date(base.getTime() + h * 3_600_000).toISOString()),
  }));
}
