import type { Repositories } from '../repositories';

/**
 * Stub for the future backend (FastAPI on Modal + PostgreSQL on Aiven).
 * NOT used yet: src/data/index.ts selects the mock implementation.
 *
 * Base URL comes from EXPO_PUBLIC_API_URL. Never put secrets in EXPO_PUBLIC_* variables:
 * they are bundled into the app. Auth will use short-lived tokens issued by our backend.
 */
export function createApiRepositories(baseUrl = process.env.EXPO_PUBLIC_API_URL ?? ''): Repositories {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    if (!baseUrl) throw new Error('EXPO_PUBLIC_API_URL is not set');
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
    return (res.status === 204 ? undefined : await res.json()) as T;
  }
  const post = (path: string, body: unknown) => request<void>(path, { method: 'POST', body: JSON.stringify(body) });

  return {
    patient: {
      get: () => request('/v1/me'),
      save: (p) => request('/v1/me', { method: 'PUT', body: JSON.stringify(p) }),
    },
    checkIns: {
      list: () => request('/v1/check-ins'),
      add: (c) => post('/v1/check-ins', c),
    },
    sensors: {
      list: () => request('/v1/sensor-aggregates'),
      addMinutes: (date, delta) => post(`/v1/sensor-aggregates/${date}`, delta),
    },
    interventions: {
      listFeedback: () => request('/v1/interventions/feedback'),
      addFeedback: (f) => post('/v1/interventions/feedback', f),
      getPlan: (date) => request(`/v1/plans/${date}`),
      savePlan: (plan) => request(`/v1/plans/${plan.date}`, { method: 'PUT', body: JSON.stringify(plan) }),
    },
    care: {
      listDoctors: () => request('/v1/care-team'),
      listRequests: () => request('/v1/consults'),
      createRequest: (r) => post('/v1/consults', r),
      listAlerts: () => request('/v1/alerts'),
      createAlert: (a) => post('/v1/alerts', a),
    },
    chat: {
      list: () => request('/v1/companion/messages'),
      save: (messages) => request('/v1/companion/messages', { method: 'PUT', body: JSON.stringify(messages) }),
      clear: () => request('/v1/companion/messages', { method: 'DELETE' }),
    },
    admin: {
      exportAll: () => request('/v1/me/export'),
      deleteAll: () => request('/v1/me', { method: 'DELETE' }),
      replaceHistory: () => Promise.reject(new Error('Demo seeding is only available in mock mode')),
    },
  };
}
