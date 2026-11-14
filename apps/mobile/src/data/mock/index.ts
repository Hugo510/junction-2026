import type { ChatMessage } from '../../domain/chat/types';
import type { ISODate } from '../../domain/dates';
import type {
  Alert,
  CheckIn,
  ConsultRequest,
  DailyPlan,
  InterventionFeedback,
  Patient,
  Phq9Entry,
  SensorAggregate,
} from '../../domain/entities';
import type { Repositories } from '../repositories';
import { mockDoctors } from './doctors';
import { KEYS, allOwnKeys, readJSON, removeAllOwnKeys, writeJSON } from './storage';

const MAX_CHAT_MESSAGES = 300;

/** Mock implementation: everything lives on the phone (AsyncStorage), data is synthetic. */
export function createMockRepositories(): Repositories {
  const append = async <T>(key: string, item: T) => writeJSON(key, [...(await readJSON<T[]>(key, [])), item]);

  return {
    patient: {
      get: () => readJSON<Patient | null>(KEYS.patient, null),
      save: (p) => writeJSON(KEYS.patient, p),
    },
    checkIns: {
      list: () => readJSON<CheckIn[]>(KEYS.checkIns, []),
      add: (c) => append(KEYS.checkIns, c),
    },
    sensors: {
      list: () => readJSON<SensorAggregate[]>(KEYS.sensors, []),
      addMinutes: async (date, delta) => {
        const all = await readJSON<SensorAggregate[]>(KEYS.sensors, []);
        const existing = all.find((s) => s.date === date) ?? { date, activityMinutes: 0, daylightMinutes: 0 };
        const updated: SensorAggregate = {
          ...existing,
          date,
          activityMinutes: existing.activityMinutes + (delta.activityMinutes ?? 0),
          daylightMinutes: existing.daylightMinutes + (delta.daylightMinutes ?? 0),
        };
        await writeJSON(KEYS.sensors, [...all.filter((s) => s.date !== date), updated]);
      },
    },
    interventions: {
      listFeedback: () => readJSON<InterventionFeedback[]>(KEYS.feedback, []),
      addFeedback: (f) => append(KEYS.feedback, f),
      getPlan: async (date: ISODate) => {
        const plans = await readJSON<DailyPlan[]>(KEYS.plans, []);
        return plans.find((p) => p.date === date) ?? null;
      },
      savePlan: async (plan) => {
        const plans = await readJSON<DailyPlan[]>(KEYS.plans, []);
        // keep only the last 30 plans
        await writeJSON(KEYS.plans, [...plans.filter((p) => p.date !== plan.date), plan].slice(-30));
      },
    },
    care: {
      listDoctors: async (now) => mockDoctors(now),
      listRequests: () => readJSON<ConsultRequest[]>(KEYS.requests, []),
      createRequest: (r) => append(KEYS.requests, r),
      listAlerts: () => readJSON<Alert[]>(KEYS.alerts, []),
      createAlert: (a) => append(KEYS.alerts, a),
    },
    chat: {
      list: () => readJSON<ChatMessage[]>(KEYS.chat, []),
      save: (messages) => writeJSON(KEYS.chat, messages.slice(-MAX_CHAT_MESSAGES)),
      clear: () => writeJSON(KEYS.chat, []),
    },
    phq9: {
      list: () => readJSON<Phq9Entry[]>(KEYS.phq9, []),
      add: (e) => append(KEYS.phq9, e),
    },
    admin: {
      exportAll: async () => {
        const out: Record<string, unknown> = {};
        for (const key of await allOwnKeys()) out[key.replace(/^btc:/, '')] = await readJSON<unknown>(key, null);
        return out;
      },
      deleteAll: () => removeAllOwnKeys(),
      replaceHistory: async (seed) => {
        await writeJSON(KEYS.checkIns, seed.checkIns);
        await writeJSON(KEYS.sensors, seed.sensors);
        await writeJSON(KEYS.feedback, seed.feedback);
        await writeJSON(KEYS.plans, []);
        await writeJSON(KEYS.requests, []);
        await writeJSON(KEYS.alerts, []);
        await writeJSON(KEYS.chat, []);
        await writeJSON(KEYS.phq9, seed.phq9 ?? []);
      },
    },
  };
}
