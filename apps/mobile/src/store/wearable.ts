import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { WearableDevice } from '../domain/wearable';

/**
 * Which (simulated) wearable is connected. Connecting is the person's consent to use its
 * daily totals; disconnecting stops using them at once. Values are never stored: they are
 * recomputed from the simulation (src/domain/wearable.ts).
 */
interface WearableState {
  device: WearableDevice | null;
  connectedAt: string | null;
  connect: (device: WearableDevice) => void;
  disconnect: () => void;
}

export const useWearable = create<WearableState>()(
  persist(
    (set) => ({
      device: null,
      connectedAt: null,
      connect: (device) => set({ device, connectedAt: new Date().toISOString() }),
      disconnect: () => set({ device: null, connectedAt: null }),
    }),
    { name: 'btc:wearable', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
