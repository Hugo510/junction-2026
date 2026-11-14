import type { CompanionSpecies, Scale5 } from '../entities';
import type { TextPart } from './types';

export interface GreetingInput {
  species: CompanionSpecies;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  lastMood?: Scale5;
  daysSinceLastCheckIn?: number;
  daylightHours: number;
}

/**
 * Companion greeting as i18n parts: "<time of day> <species voice> <one context line>".
 * Context priority: welcome back > night > low mood > short daylight > mood.
 * Never reproachful: missing days become "Welcome back".
 */
export function greetingParts(input: GreetingInput): TextPart[] {
  const parts: TextPart[] = [{ key: `companion.greeting.${input.timeOfDay}` }, { key: `companion.voice.${input.species}` }];
  let context: string;
  if (input.daysSinceLastCheckIn !== undefined && input.daysSinceLastCheckIn >= 2) context = 'welcomeBack';
  else if (input.timeOfDay === 'night') context = 'night';
  else if (input.lastMood !== undefined && input.lastMood <= 2) context = 'lowMood';
  else if (input.daylightHours < 9 && input.timeOfDay !== 'evening') context = 'daylight';
  else if (input.lastMood === undefined) context = 'noMood';
  else context = input.lastMood >= 4 ? 'highMood' : 'midMood';
  parts.push({ key: `companion.context.${context}` });
  return parts;
}

export function checkInResponseKey(mood: Scale5, urgent: boolean): string {
  if (urgent) return 'companion.checkin.urgent';
  if (mood <= 2) return 'companion.checkin.low';
  if (mood === 3) return 'companion.checkin.mid';
  return 'companion.checkin.high';
}
