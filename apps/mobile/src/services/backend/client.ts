/**
 * Thin client for our own backend (FastAPI, see backend/ on main).
 *
 * The app is local-first: it works fully without a server. When EXPO_PUBLIC_API_URL is set,
 * the backend adds three optional things: a mirror of check-ins and consents ("one live call"),
 * AI replies in the chat (opt-in) and the companion's voice (opt-in).
 *
 * No secret ever lives here: EXPO_PUBLIC_* values are bundled into the app, so the URL is
 * all it knows. Model and voice keys stay on the server.
 */
const BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');
const API = `${BASE}/api/v1`;

export const backendConfigured = BASE.length > 0;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    path: string,
  ) {
    super(`API ${path} failed: ${status}`);
  }
}

let token: string | null = null;

async function raw(path: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${API}${path}`, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Synthetic demo patient (the backend has no real accounts yet). */
async function login(): Promise<string> {
  const res = await raw('/auth/demo-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'patient' }) }, 8000);
  if (!res.ok) throw new ApiError(res.status, '/auth/demo-login');
  const data = (await res.json()) as { token: string };
  token = data.token;
  return data.token;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH';
  body?: unknown;
  /** false for public endpoints (status, health). */
  auth?: boolean;
  timeoutMs?: number;
}

export async function api<T>(path: string, { method = 'GET', body, auth = true, timeoutMs = 8000 }: RequestOptions = {}): Promise<T> {
  if (!backendConfigured) throw new Error('EXPO_PUBLIC_API_URL is not set');
  const send = async () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (auth) headers.Authorization = `Bearer ${token ?? (await login())}`;
    return raw(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }, timeoutMs);
  };
  let res = await send();
  // Tokens live in the server's memory: after a restart ours is unknown. Log in again once.
  if (res.status === 401 && auth) {
    token = null;
    res = await send();
  }
  if (!res.ok) throw new ApiError(res.status, path);
  return (res.status === 204 ? undefined : await res.json()) as T;
}
