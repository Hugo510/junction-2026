import { create } from 'zustand';

import { repositories } from '../data';
import { rebasePersona, type Persona } from '../data/personas';
import { generateHistory, type SeedScenario } from '../data/seed';
import { enqueueNormal, positionInQueue, syntheticWaitingQueue } from '../domain/consultQueue';
import type {
  Alert,
  CheckIn,
  Companion,
  ConsultReason,
  ConsultRequest,
  DailyPlan,
  Doctor,
  FeedbackRating,
  InterventionFeedback,
  InterventionId,
  Patient,
  PerceivedUrgency,
  Phq9Entry,
  PlanItemStatus,
  SensorAggregate,
} from '../domain/entities';
import { INTERVENTION_IDS } from '../domain/interventions';
import { pickInterventions } from '../domain/interventionPicker';
import { priorityScore } from '../domain/priorityScore';
import { assessCheckInRisk, routeToChannel, type RiskAssessment } from '../domain/riskRules';
import { outreachLevel, shouldNotifyCareTeam, type OutreachLevel } from '../domain/outreach';
import { mulberry32 } from '../domain/rng';
import { now, todayISO, yesterdayISO } from './clock';
import { useSettings } from './settings';

export type CheckInInput = Omit<CheckIn, 'id' | 'date' | 'createdAt'>;

export type ConsultOutcome =
  | { channel: 'normalQueue'; request: ConsultRequest }
  | { channel: 'urgent'; alert: Alert };

interface DataState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  patient: Patient | null;
  checkIns: CheckIn[];
  sensors: SensorAggregate[];
  feedback: InterventionFeedback[];
  plan: DailyPlan | null;
  requests: ConsultRequest[];
  alerts: Alert[];
  phq9: Phq9Entry[];
  doctors: Doctor[];

  load: () => Promise<void>;
  createPatient: (companion: Companion) => Promise<void>;
  updateCompanion: (companion: Companion) => Promise<void>;
  submitCheckIn: (input: CheckInInput) => Promise<{ checkIn: CheckIn; risk: RiskAssessment }>;
  ensureTodayPlan: () => Promise<void>;
  setPlanStatus: (id: InterventionId, status: PlanItemStatus) => Promise<void>;
  addFeedback: (id: InterventionId, rating: FeedbackRating) => Promise<void>;
  addSensorMinutes: (delta: Partial<Pick<SensorAggregate, 'activityMinutes' | 'daylightMinutes'>>) => Promise<void>;
  requestConsult: (reason: ConsultReason, urgency: PerceivedUrgency) => Promise<ConsultOutcome>;
  raiseAlert: (source: Alert['source'], level?: Alert['level']) => Promise<Alert>;
  /** Saves a questionnaire: 2 answers = PHQ-2, 9 answers = full PHQ-9. */
  addPhq: (items: number[]) => Promise<Phq9Entry>;
  /** Clinic-only status: care ended → all outreach stops (demo: toggled from demo mode / clinician screen). */
  setCareEnded: (on: boolean) => Promise<void>;
  /** Clinic-only flag (demo: toggled from demo mode). */
  setBipolarFlag: (on: boolean) => Promise<void>;
  /** Silence ladder: returns the level and (with consent) gently notifies the care team. */
  checkSilence: () => Promise<OutreachLevel>;
  seedScenario: (scenario: SeedScenario) => Promise<void>;
  /** Demo: replace the history with a synthetic persona (dates are moved so it ends yesterday). */
  loadPersona: (persona: Persona) => Promise<void>;
  deleteEverything: () => Promise<void>;
}

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const hashString = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

const empty = {
  patient: null,
  checkIns: [],
  sensors: [],
  feedback: [],
  plan: null,
  requests: [],
  alerts: [],
  phq9: [],
  doctors: [],
};

export const useData = create<DataState>()((set, get) => {
  const r = repositories;

  const reloadHistory = async () => {
    const [checkIns, sensors, feedback, requests, alerts, phq9] = await Promise.all([
      r.checkIns.list(),
      r.sensors.list(),
      r.interventions.listFeedback(),
      r.care.listRequests(),
      r.care.listAlerts(),
      r.phq9.list(),
    ]);
    set({ checkIns, sensors, feedback, requests, alerts, phq9 });
  };

  return {
    status: 'idle',
    ...empty,

    load: async () => {
      set({ status: 'loading' });
      try {
        const [patient, doctors] = await Promise.all([r.patient.get(), r.care.listDoctors(now())]);
        set({ patient, doctors });
        await reloadHistory();
        if (patient) await get().ensureTodayPlan();
        set({ status: 'ready' });
      } catch {
        set({ status: 'error' });
      }
    },

    createPatient: async (companion) => {
      const patient: Patient = {
        id: newId('patient'),
        createdAt: now().toISOString(),
        companion,
        carePath: useSettings.getState().carePath ?? 'postTreatment',
      };
      await r.patient.save(patient);
      await r.admin.replaceHistory(generateHistory('good', yesterdayISO()));
      set({ patient, plan: null });
      await reloadHistory();
      await get().ensureTodayPlan();
    },

    updateCompanion: async (companion) => {
      const patient = get().patient;
      if (!patient) return;
      const updated = { ...patient, companion };
      await r.patient.save(updated);
      set({ patient: updated });
    },

    submitCheckIn: async (input) => {
      const created = now();
      const checkIn: CheckIn = { ...input, id: newId('checkin'), date: todayISO(), createdAt: created.toISOString() };
      await r.checkIns.add(checkIn);
      const risk = assessCheckInRisk(checkIn);
      if (routeToChannel(risk) === 'urgent') {
        await get().raiseAlert('checkIn');
      }
      set({ checkIns: [...get().checkIns, checkIn] });
      return { checkIn, risk };
    },

    ensureTodayPlan: async () => {
      const date = todayISO();
      const existing = await r.interventions.getPlan(date);
      if (existing) {
        set({ plan: existing });
        return;
      }
      const { feedback, checkIns } = get();
      const ids = pickInterventions({
        ids: INTERVENTION_IDS,
        feedback,
        checkIns,
        rng: mulberry32(hashString(date) + feedback.length),
        count: 3,
      });
      const plan: DailyPlan = { date, items: ids.map((interventionId) => ({ interventionId, status: 'pending' })) };
      await r.interventions.savePlan(plan);
      set({ plan });
    },

    setPlanStatus: async (id, status) => {
      const plan = get().plan;
      if (!plan) return;
      const updated: DailyPlan = {
        ...plan,
        items: plan.items.map((i) => (i.interventionId === id ? { ...i, status } : i)),
      };
      await r.interventions.savePlan(updated);
      set({ plan: updated });
    },

    addFeedback: async (interventionId, rating) => {
      const fb: InterventionFeedback = { id: newId('fb'), interventionId, date: todayISO(), rating };
      await r.interventions.addFeedback(fb);
      set({ feedback: [...get().feedback, fb] });
    },

    addSensorMinutes: async (delta) => {
      await r.sensors.addMinutes(todayISO(), delta);
      set({ sensors: await r.sensors.list() });
    },

    requestConsult: async (reason, perceivedUrgency) => {
      const { checkIns, sensors } = get();
      const today = todayISO();
      const latestToday = [...checkIns].reverse().find((c) => c.date === today);
      const risk = assessCheckInRisk({ safetyConcern: latestToday?.safetyConcern ?? false });
      const priority = priorityScore({ checkIns, sensors, today, perceivedUrgency, flags: { bipolar: get().patient?.bipolarFlag } });

      if (routeToChannel(risk, priority) === 'urgent') {
        const alert = await get().raiseAlert('contactCareTeam');
        return { channel: 'urgent', alert };
      }

      const created = now();
      const id = newId('consult');
      const queue = enqueueNormal(
        syntheticWaitingQueue(created),
        { id, priority: priority.score, enqueuedAt: created.toISOString() },
        risk,
      );
      const request: ConsultRequest = {
        id,
        createdAt: created.toISOString(),
        reason,
        perceivedUrgency,
        priority,
        initialPosition: positionInQueue(queue, id),
      };
      await r.care.createRequest(request);
      set({ requests: [...get().requests, request] });
      return { channel: 'normalQueue', request };
    },

    raiseAlert: async (source, level = 'urgent') => {
      const alert: Alert = { id: newId('alert'), createdAt: now().toISOString(), level, source };
      await r.care.createAlert(alert);
      set({ alerts: [...get().alerts, alert] });
      return alert;
    },

    addPhq: async (items) => {
      const entry: Phq9Entry = {
        date: todayISO(),
        items,
        total: items.reduce((a, b) => a + b, 0),
        kind: items.length === 9 ? 'phq9' : 'phq2',
      };
      await r.phq9.add(entry);
      set({ phq9: [...get().phq9, entry] });
      return entry;
    },

    setCareEnded: async (on) => {
      const patient = get().patient;
      if (!patient) return;
      const updated = { ...patient, careEnded: on };
      await r.patient.save(updated);
      set({ patient: updated });
    },

    setBipolarFlag: async (on) => {
      const patient = get().patient;
      if (!patient) return;
      const updated = { ...patient, bipolarFlag: on };
      await r.patient.save(updated);
      set({ patient: updated });
    },

    checkSilence: async () => {
      const { checkIns, alerts, patient } = get();
      if (patient?.careEnded) return 'none';
      const today = todayISO();
      const level = outreachLevel(checkIns, today);
      const consent = useSettings.getState().consents.careTeamAfterSilence;
      if (shouldNotifyCareTeam(level, consent, alerts, today)) await get().raiseAlert('silence', 'info');
      return level;
    },

    loadPersona: async (persona) => {
      await r.admin.replaceHistory(rebasePersona(persona, yesterdayISO()));
      const current = get().patient;
      if (current) {
        const updated: Patient = {
          ...current,
          companion: persona.persona.companion ?? current.companion,
          bipolarFlag: !!persona.persona.bipolarFlag,
        };
        await r.patient.save(updated);
        set({ patient: updated });
      }
      if (persona.persona.trustedContact) useSettings.getState().setTrustedContact(persona.persona.trustedContact);
      set({ plan: null });
      await reloadHistory();
      await get().ensureTodayPlan();
    },

    seedScenario: async (scenario) => {
      await r.admin.replaceHistory(generateHistory(scenario, yesterdayISO()));
      set({ plan: null });
      await reloadHistory();
      await get().ensureTodayPlan();
    },

    deleteEverything: async () => {
      await r.admin.deleteAll();
      // Keep the (fictional) care team: it is not patient data and is only loaded at startup.
      set({ ...empty, doctors: get().doctors, status: 'ready' });
    },
  };
});
