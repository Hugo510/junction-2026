import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

import { distanceMeters } from '../../domain/daylight';

export type PermissionState = 'unknown' | 'granted' | 'denied';

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/** Latitude rounded to 1 decimal (~11 km). Used only for the daylight estimate, never stored. */
export async function approximateLatitude(): Promise<number | null> {
  try {
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    return Math.round(pos.coords.latitude * 10) / 10;
  } catch {
    return null;
  }
}

const OUTSIDE_RADIUS_M = 60;
const POLL_MS = 20_000;

/**
 * Estimates minutes spent away from the starting point during a walk.
 * Positions live only in memory for the duration of the walk and are discarded after.
 */
export function useOutdoorEstimate(active: boolean, enabled: boolean) {
  const [permission, setPermission] = useState<PermissionState>('unknown');
  const [outsideSeconds, setOutsideSeconds] = useState(0);
  const start = useRef<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (!active || !enabled) return;
    let alive = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    (async () => {
      const ok = await requestLocationPermission();
      if (!alive) return;
      setPermission(ok ? 'granted' : 'denied');
      if (!ok) return;
      try {
        const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        start.current = { lat: p.coords.latitude, lon: p.coords.longitude };
      } catch {
        return;
      }
      timer = setInterval(async () => {
        try {
          const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (start.current && distanceMeters(start.current, { lat: p.coords.latitude, lon: p.coords.longitude }) > OUTSIDE_RADIUS_M) {
            if (alive) setOutsideSeconds((s) => s + POLL_MS / 1000);
          }
        } catch {
          /* ignore a missed sample */
        }
      }, POLL_MS);
    })();

    return () => {
      alive = false;
      if (timer) clearInterval(timer);
      start.current = null; // discard coordinates
    };
  }, [active, enabled]);

  return { permission, outsideMinutes: Math.round(outsideSeconds / 60) };
}
