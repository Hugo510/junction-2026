import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { EarlySign } from '../domain/entities';

/**
 * What the CLINIC set for each person (demo: kept on this device).
 * "The clinic tells Hiillos what to watch": the early signs a clinician knows for this person
 * are named first when they show up. They never change the score and never raise an alert.
 */
interface ClinicState {
  earlySigns: Record<string, EarlySign[]>;
  toggleSign: (personId: string, sign: EarlySign) => void;
}

export const useClinic = create<ClinicState>()(
  persist(
    (set) => ({
      earlySigns: {},
      toggleSign: (personId, sign) =>
        set((s) => {
          const current = s.earlySigns[personId] ?? [];
          const next = current.includes(sign) ? current.filter((x) => x !== sign) : [...current, sign];
          return { earlySigns: { ...s.earlySigns, [personId]: next } };
        }),
    }),
    { name: 'btc:clinic', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
