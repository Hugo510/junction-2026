import AsyncStorage from '@react-native-async-storage/async-storage';

/** All keys written by the mock repositories share this prefix. */
export const KEY_PREFIX = 'btc:';

export const KEYS = {
  patient: `${KEY_PREFIX}patient`,
  checkIns: `${KEY_PREFIX}checkIns`,
  sensors: `${KEY_PREFIX}sensors`,
  feedback: `${KEY_PREFIX}feedback`,
  plans: `${KEY_PREFIX}plans`,
  requests: `${KEY_PREFIX}requests`,
  alerts: `${KEY_PREFIX}alerts`,
  chat: `${KEY_PREFIX}chat`,
  phq9: `${KEY_PREFIX}phq9`,
} as const;

export async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function allOwnKeys(): Promise<string[]> {
  const keys = await AsyncStorage.getAllKeys();
  return keys.filter((k) => k.startsWith(KEY_PREFIX));
}

export async function removeAllOwnKeys(): Promise<void> {
  await AsyncStorage.multiRemove(await allOwnKeys());
}
