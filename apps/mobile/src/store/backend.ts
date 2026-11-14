import { create } from 'zustand';

import { toBackendCheckIn, toBackendConsents } from '../data/api/mapping';
import type { CheckIn, SupportedLanguage } from '../domain/entities';
import { api, ApiError, backendConfigured } from '../services/backend/client';
import type { Consents } from './settings';

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
  mirrorCheckIn: (checkIn: CheckIn) => void;
  mirrorConsents: (consents: Consents) => void;
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

  mirrorCheckIn: (checkIn) => {
    if (!backendConfigured) return;
    void (async () => {
      const body = toBackendCheckIn(checkIn);
      try {
        try {
          await api('/checkins', { method: 'POST', body });
        } catch (e) {
          // One check-in per day on the server: a second one (e.g. a safety answer later
          // the same day) replaces it, so a safety report is never dropped.
          if (!(e instanceof ApiError) || e.status !== 409) throw e;
          await api(`/checkins/${body.date}`, { method: 'PUT', body });
        }
        set({ state: 'online', lastMirrored: body.date });
      } catch {
        set({ state: 'offline' });
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
export async function requestCompanionSpeech(text: string, language: SupportedLanguage): Promise<string> {
  const res = await api<{ audioBase64: string }>('/companion/speech', { method: 'POST', body: { text, language }, timeoutMs: 25000 });
  return res.audioBase64;
}
