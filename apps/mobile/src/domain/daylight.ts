import { dayOfYear } from './dates';

/** Helsinki, used when location permission is not granted. */
export const DEFAULT_LATITUDE = 60.17;

/**
 * Approximate hours of daylight for a latitude and date (simple astronomical
 * formula, ±15 min accuracy is enough for a wellbeing hint).
 */
export function daylightHours(latitude: number, date: Date): number {
  const rad = Math.PI / 180;
  const declination = 23.44 * Math.sin(rad * (360 / 365) * (284 + dayOfYear(date)));
  const cosHourAngle = -Math.tan(latitude * rad) * Math.tan(declination * rad);
  if (cosHourAngle >= 1) return 0; // polar night
  if (cosHourAngle <= -1) return 24; // midnight sun
  const hourAngle = Math.acos(cosHourAngle) / rad;
  return Math.round(((2 * hourAngle) / 15) * 10) / 10;
}

/** Distance in metres between two points (haversine). Coordinates are never stored. */
export function distanceMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}
