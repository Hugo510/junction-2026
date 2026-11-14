import { create } from 'zustand';

import type { NoticeKind } from '../domain/outreach';

/**
 * Simulated "Hiillos reaches out first" notification (demo mode).
 * Real push notifications are roadmap (limited in Expo Go); this shows the same message in-app.
 */
export interface ReachOutNotice {
  kind: NoticeKind;
  /** Full text, shown only when discreet notifications are turned off. */
  textKey: string;
  params?: Record<string, string>;
}

interface ReachOutState {
  notice: ReachOutNotice | null;
  show: (notice: ReachOutNotice) => void;
  dismiss: () => void;
}

export const useReachOut = create<ReachOutState>()((set) => ({
  notice: null,
  show: (notice) => set({ notice }),
  dismiss: () => set({ notice: null }),
}));
