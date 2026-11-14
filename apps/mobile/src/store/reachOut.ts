import { create } from 'zustand';

import type { TextPart } from '../domain/chat/types';

/**
 * Simulated "Hiillos reaches out first" notification (demo mode).
 * Real push notifications are roadmap (limited in Expo Go); this shows the same message in-app.
 */
interface ReachOutState {
  notice: TextPart | null;
  show: (notice: TextPart) => void;
  dismiss: () => void;
}

export const useReachOut = create<ReachOutState>()((set) => ({
  notice: null,
  show: (notice) => set({ notice }),
  dismiss: () => set({ notice: null }),
}));
