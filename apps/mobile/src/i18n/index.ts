import { format as formatFns, type Locale } from 'date-fns';
import { enGB, es, fi, sv } from 'date-fns/locale';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import type { SupportedLanguage } from '../domain/entities';
import en from './locales/en.json';
import esT from './locales/es.json';
import fiT from './locales/fi.json';
import svT from './locales/sv.json';

/** Display order in the language pickers: English, Finnish, Swedish, Spanish. */
export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = ['en', 'fi', 'sv', 'es'];

const isSupported = (code: string | null | undefined): code is SupportedLanguage =>
  !!code && (SUPPORTED_LANGUAGES as readonly string[]).includes(code);

/** Device language if supported, otherwise English. */
export function detectDeviceLanguage(): SupportedLanguage {
  try {
    const code = getLocales()[0]?.languageCode;
    return isSupported(code) ? code : 'en';
  } catch {
    return 'en';
  }
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fi: { translation: fiT },
    es: { translation: esT },
    sv: { translation: svT },
  },
  lng: detectDeviceLanguage(),
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LANGUAGES as SupportedLanguage[],
  interpolation: { escapeValue: false },
  initAsync: false,
  returnNull: false,
});

export function applyLanguage(lang: SupportedLanguage): void {
  if (i18n.language !== lang) void i18n.changeLanguage(lang);
}

export function currentLanguage(): SupportedLanguage {
  return isSupported(i18n.language) ? i18n.language : 'en';
}

const DATE_LOCALES: Record<SupportedLanguage, Locale> = { en: enGB, fi, es, sv };

export function dateLocale(lang: SupportedLanguage = currentLanguage()): Locale {
  return DATE_LOCALES[lang];
}

/** date-fns format with the active app language. */
export function formatDate(date: Date, pattern: string, lang: SupportedLanguage = currentLanguage()): string {
  return formatFns(date, pattern, { locale: dateLocale(lang) });
}

/** "sábado 14 noviembre" → "Sábado 14 noviembre" (only the first letter, correct for es/fi/sv). */
export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default i18n;
