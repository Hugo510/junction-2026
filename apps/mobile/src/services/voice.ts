import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import type { SupportedLanguage } from '../domain/entities';
import { requestCompanionSpeech } from '../store/backend';

/**
 * Reads a COMPANION message aloud (opt-in). The audio comes from our backend, which holds the
 * voice-service key. What the person types is never sent here.
 */
const cache = new Map<string, string>();
let player: AudioPlayer | null = null;
let onStop: (() => void) | null = null;

function hashString(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function stopSpeaking(): void {
  const current = player;
  const done = onStop;
  player = null;
  onStop = null;
  try {
    current?.pause();
    current?.remove();
  } catch {
    // Already released.
  }
  done?.();
}

async function audioUri(text: string, language: SupportedLanguage): Promise<string> {
  const key = `${language}:${text}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const base64 = await requestCompanionSpeech(text, language);
  let uri: string;
  if (Platform.OS === 'web') {
    uri = `data:audio/mpeg;base64,${base64}`;
  } else {
    // Players on phones need a file; it lives in the cache folder and the system may clear it.
    const file = new File(Paths.cache, `hiillos-voice-${hashString(key)}.mp3`);
    if (!file.exists) file.create();
    await file.write(base64, { encoding: 'base64' });
    uri = file.uri;
  }
  cache.set(key, uri);
  return uri;
}

/** Plays the message. `onDone` runs when it finishes or is stopped. Throws if the voice is unavailable. */
export async function speak(text: string, language: SupportedLanguage, onDone: () => void): Promise<void> {
  stopSpeaking();
  const uri = await audioUri(text.trim().slice(0, 600), language);
  await setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
  const next = createAudioPlayer({ uri });
  player = next;
  onStop = onDone;
  next.addListener('playbackStatusUpdate', (status) => {
    if (status.didJustFinish && player === next) stopSpeaking();
  });
  next.play();
}
