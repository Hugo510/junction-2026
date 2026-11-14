import { create } from 'zustand';

import { shouldReplaceOnConflict, toBackendCheckIn, toBackendConsents } from '../data/api/mapping';
import type { CheckIn, SupportedLanguage } from '../domain/entities';
import type { WearableDay } from '../domain/wearable';
import { api, ApiError, backendConfigured } from '../services/backend/client';
import { useSettings, type Consents } from './settings';

export type BackendState = 'off' | 'connecting' | 'online' | 'offline';

interface BackendStore {
  state: BackendState;
  /** Optional features configured on the server. */
  llm: boolean;
  voice: boolean;
  /** Date of the last check-in the server accepted (shown in demo mode). */
  lastMirrored: string | null;
  /** Asks the server what it can do. Safe to call often; never throws. */
  connect: () => Promise<void>;
  /** Fire-and-forget copies. The phone stays the source of truth; failures are silent. */
  /** safetyReportedToday: an earlier entry of the same day answered "yes" to the safety question. */
  mirrorCheckIn: (checkIn: CheckIn, safetyReportedToday?: boolean) => void;
  mirrorConsents: (consents: Consents) => void;
  /** Copies the wearable's daily totals (and its consent). "synthetic" is sent as the source: the data is simulated. */
  mirrorWearable: (days: WearableDay[], connected: boolean) => void;
}

export interface CompanionTurn {
  role: 'user' | 'companion';
  text: string;
}

export interface CompanionReply {
  reply: string | null;
  source: 'llm' | 'safety';
  crisis: boolean;
}

export const useBackend = create<BackendStore>()((set, get) => ({
  state: backendConfigured ? 'connecting' : 'off',
  llm: false,
  voice: false,
  lastMirrored: null,

  connect: async () => {
    if (!backendConfigured) return;
    try {
      const status = await api<{ llm: boolean; voice: boolean }>('/companion/status', { auth: false, timeoutMs: 6000 });
      set({ state: 'online', llm: !!status.llm, voice: !!status.voice });
    } catch {
      set({ state: 'offline', llm: false, voice: false });
    }
  },

  mirrorCheckIn: (checkIn, safetyReportedToday = false) => {
    if (!backendConfigured) return;
    void (async () => {
      const send = async (body: ReturnType<typeof toBackendCheckIn>) => {
        try {
          await api('/checkins', { method: 'POST', body });
        } catch (e) {
          // A second ordinary check-in on the same day replaces the first (the server accepts a
          // safety report directly; this also covers an older server that answers 409 to it).
          if (!(e instanceof ApiError) || e.status !== 409) throw e;
          // Never replace the day's entry when it may be a safety report (see mapping.ts).
          if (!shouldReplaceOnConflict(checkIn, safetyReportedToday)) return;
          try {
            await api(`/checkins/${body.date}`, { method: 'PUT', body });
          } catch (put) {
            // 409 on PUT = the server refuses to replace a safety report. That is the right outcome.
            if (!(put instanceof ApiError) || put.status !== 409) throw put;
          }
        }
      };
      try {
        try {
          await send(toBackendCheckIn(checkIn));
        } catch (e) {
          // An older server still requires energy and anxiety: retry once with the midpoint.
          if (!(e instanceof ApiError) || e.status !== 422) throw e;
          await send(toBackendCheckIn(checkIn, { legacy: true }));
        }
        set({ state: 'online', lastMirrored: checkIn.date });
      } catch {
        set({ state: 'offline' });
      }
    })();
  },

  mirrorWearable: (days, connected) => {
    if (!backendConfigured || get().state === 'off') return;
    void (async () => {
      try {
        const consents = { ...useSettings.getState().consents };
        await api('/me/consents', { method: 'PUT', body: { ...toBackendConsents(consents), wearable: connected } });
        if (connected && days.length > 0) {
          const items = days.flatMap((d) => {
            const period = { periodStart: `${d.date}T00:00:00Z`, periodEnd: `${d.date}T23:59:59Z`, source: 'synthetic' };
            return [
              // Steps are left out: on the server they belong to the movement consent.
              { type: 'sleep', value: d.sleepHours, unit: 'hours', ...period },
              { type: 'resting_heart_rate', value: d.restingHr, unit: 'bpm', ...period },
            ];
          });
          await api('/sensors/aggregates', { method: 'POST', body: { items } });
        }
        set({ state: 'online' });
      } catch {
        // An older server does not know these types yet: the app keeps working on its own.
      }
    })();
  },

  mirrorConsents: (consents) => {
    if (!backendConfigured || get().state === 'off') return;
    void api('/me/consents', { method: 'PUT', body: toBackendConsents(consents) })
      .then(() => set({ state: 'online' }))
      .catch(() => set({ state: 'offline' }));
  },
}));

/** One AI reply. Throws when the server or the model is not available (caller falls back). */
export function requestCompanionReply(input: { message: string; language: SupportedLanguage; companionName: string; history: CompanionTurn[] }): Promise<CompanionReply> {
  return api<CompanionReply>('/companion/reply', { method: 'POST', body: input, timeoutMs: 15000 });
}

/** MP3 (base64) of a message the companion wrote. */
export async function requestCompanionSpeech(text: string, language: SupportedLanguage, companion?: string): Promise<string> {
  const res = await api<{ audioBase64: string }>('/companion/speech', { method: 'POST', body: { text, language, companion }, timeoutMs: 25000 });
  return res.audioBase64;
}
