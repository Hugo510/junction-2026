import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CarePath, SupportedLanguage } from '../domain/entities';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface Consents {
  /** Accelerometer (movement). */
  movement: boolean;
  /** Tap pattern (reaction game). */
  taps: boolean;
  /** Approximate location for outdoor/daylight estimation. Coordinates are never stored. */
  location: boolean;
  /** Vibration during guided exercises. */
  vibration: boolean;
  /** Let the care team know (gently) if there are no check-ins for 7 days. */
  careTeamAfterSilence: boolean;
}

/** Someone the person trusts. Stays ONLY on this phone; used for one-tap call / message. */
export interface TrustedContact {
  name: string;
  phone: string;
}

interface SettingsData {
  language: SupportedLanguage | null;
  themeMode: ThemeMode;
  largeText: boolean;
  reduceMotion: boolean;
  consents: Consents;
  onboarded: boolean;
  /** Demo-only: simulated days added to the real date. */
  dayOffset: number;
  trustedContact: TrustedContact | null;
  /** Notification previews never mention mood or health (others may see the phone). */
  discreetNotifications: boolean;
  carePath: CarePath | null;
  /** Opt-in: typed chat messages may be sent to our server and an AI service for a reply. */
  aiCompanion: boolean;
  /** Opt-in: the companion's own messages can be read aloud by a voice service. */
  companionVoice: boolean;
  /** Opt-in: start from what helped other people (aggregated scores only). */
  sharedLearning: boolean;
}

interface SettingsState extends SettingsData {
  hydrated: boolean;
  setLanguage: (language: SupportedLanguage) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setLargeText: (on: boolean) => void;
  setReduceMotion: (on: boolean) => void;
  setConsent: (key: keyof Consents, on: boolean) => void;
  setOnboarded: (on: boolean) => void;
  advanceDay: () => void;
  setTrustedContact: (contact: TrustedContact | null) => void;
  setDiscreetNotifications: (on: boolean) => void;
  setCarePath: (path: CarePath) => void;
  setAiCompanion: (on: boolean) => void;
  setCompanionVoice: (on: boolean) => void;
  setSharedLearning: (on: boolean) => void;
  reset: () => void;
}

export const DEFAULT_CONSENTS: Consents = { movement: false, taps: false, location: false, vibration: false, careTeamAfterSilence: false };

const defaults: SettingsData = {
  language: null,
  themeMode: 'system',
  largeText: false,
  reduceMotion: false,
  consents: DEFAULT_CONSENTS,
  onboarded: false,
  dayOffset: 0,
  trustedContact: null,
  discreetNotifications: true,
  carePath: null,
  aiCompanion: false,
  companionVoice: false,
  sharedLearning: false,
};

export const SETTINGS_STORAGE_KEY = 'btc:settings';

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      hydrated: false,
      setLanguage: (language) => set({ language }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setLargeText: (largeText) => set({ largeText }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setConsent: (key, on) => set((s) => ({ consents: { ...s.consents, [key]: on } })),
      setOnboarded: (onboarded) => set({ onboarded }),
      advanceDay: () => set((s) => ({ dayOffset: s.dayOffset + 1 })),
      setTrustedContact: (trustedContact) => set({ trustedContact }),
      setDiscreetNotifications: (discreetNotifications) => set({ discreetNotifications }),
      setCarePath: (carePath) => set({ carePath }),
      setAiCompanion: (aiCompanion) => set({ aiCompanion }),
      setCompanionVoice: (companionVoice) => set({ companionVoice }),
      setSharedLearning: (sharedLearning) => set({ sharedLearning }),
      reset: () => set({ ...defaults }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated: _h, ...rest }) => {
        const data: SettingsData = {
          language: rest.language,
          themeMode: rest.themeMode,
          largeText: rest.largeText,
          reduceMotion: rest.reduceMotion,
          consents: { ...DEFAULT_CONSENTS, ...rest.consents },
          onboarded: rest.onboarded,
          dayOffset: rest.dayOffset,
          trustedContact: rest.trustedContact,
          discreetNotifications: rest.discreetNotifications,
          carePath: rest.carePath,
          aiCompanion: rest.aiCompanion ?? false,
          companionVoice: rest.companionVoice ?? false,
          sharedLearning: rest.sharedLearning ?? false,
        };
        return data;
      },
      onRehydrateStorage: () => () => {
        useSettings.setState({ hydrated: true });
      },
    },
  ),
);
