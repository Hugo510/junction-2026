import { Accelerometer } from 'expo-sensors';
import { useEffect, useState } from 'react';

export interface AccelSample {
  x: number;
  y: number;
  z: number;
}

/** Subscribes to the accelerometer (Expo Go compatible). Returns an unsubscribe function. */
export function subscribeAccelerometer(onSample: (s: AccelSample) => void, intervalMs = 100): () => void {
  let sub: { remove: () => void } | null = null;
  let cancelled = false;
  Accelerometer.isAvailableAsync()
    .then((ok) => {
      if (!ok || cancelled) return;
      Accelerometer.setUpdateInterval(intervalMs);
      sub = Accelerometer.addListener(onSample);
    })
    .catch(() => undefined);
  return () => {
    cancelled = true;
    sub?.remove();
  };
}

export interface MovementState {
  available: boolean;
  /** Smoothed movement intensity 0–1 (deviation from 1 g). */
  intensity: number;
  isMoving: boolean;
}

/** Movement intensity from the accelerometer. Only used live; raw samples are never stored. */
export function useMovement(enabled: boolean): MovementState {
  const [state, setState] = useState<MovementState>({ available: false, intensity: 0, isMoving: false });
  useEffect(() => {
    if (!enabled) {
      setState({ available: false, intensity: 0, isMoving: false });
      return;
    }
    let smoothed = 0;
    return subscribeAccelerometer(({ x, y, z }) => {
      const deviation = Math.abs(Math.sqrt(x * x + y * y + z * z) - 1);
      smoothed = smoothed * 0.85 + deviation * 0.15;
      const intensity = Math.min(1, smoothed * 5);
      setState({ available: true, intensity, isMoving: intensity > 0.12 });
    }, 120);
  }, [enabled]);
  return state;
}
