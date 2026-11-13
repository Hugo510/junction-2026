/**
 * Crisis resources shown on the crisis screen.
 *
 * TODO: verificar números con mentores antes del demo.
 * Source used for the initial values: MIELI Mental Health Finland crisis helpline (mieli.fi).
 * Numbers and opening hours change — confirm them before showing the app to anyone.
 */
export const EMERGENCY_NUMBER = '112';

export interface CrisisResource {
  id: string;
  /** i18n key for the name. */
  nameKey: string;
  /** Phone number in dialable form. */
  phone: string;
  /** i18n key for availability. */
  hoursKey: string;
  languages: ('fi' | 'sv' | 'en')[];
}

export const CRISIS_RESOURCES: CrisisResource[] = [
  { id: 'mieli-fi', nameKey: 'crisis.resources.mieliFi', phone: '0925250111', hoursKey: 'crisis.resources.always', languages: ['fi'] },
  { id: 'mieli-sv', nameKey: 'crisis.resources.mieliSv', phone: '0925250112', hoursKey: 'crisis.resources.check', languages: ['sv'] },
  { id: 'mieli-en', nameKey: 'crisis.resources.mieliEn', phone: '0925250116', hoursKey: 'crisis.resources.check', languages: ['en'] },
];

/** Human-readable phone number (e.g. "09 2525 0111"). */
export function displayPhone(phone: string): string {
  return phone.length === 10 ? `${phone.slice(0, 2)} ${phone.slice(2, 6)} ${phone.slice(6)}` : phone;
}
