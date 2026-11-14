import type { ChatMessage } from '../domain/chat/types';
import type { ISODate } from '../domain/dates';
import type {
  Alert,
  CheckIn,
  ConsultRequest,
  DailyPlan,
  Doctor,
  InterventionFeedback,
  Patient,
  SensorAggregate,
} from '../domain/entities';
import type { SeedResult } from './seed';

/**
 * Repository interfaces. The UI and stores only depend on these.
 * Implementations: ./mock (AsyncStorage + synthetic data) and ./api (future backend).
 */
export interface PatientRepository {
  get(): Promise<Patient | null>;
  save(patient: Patient): Promise<void>;
}

export interface CheckInRepository {
  list(): Promise<CheckIn[]>;
  add(checkIn: CheckIn): Promise<void>;
}

export interface SensorRepository {
  list(): Promise<SensorAggregate[]>;
  /** Adds minutes to the aggregate of a day (creates it if needed). */
  addMinutes(date: ISODate, delta: Partial<Pick<SensorAggregate, 'activityMinutes' | 'daylightMinutes'>>): Promise<void>;
}

export interface InterventionRepository {
  listFeedback(): Promise<InterventionFeedback[]>;
  addFeedback(feedback: InterventionFeedback): Promise<void>;
  getPlan(date: ISODate): Promise<DailyPlan | null>;
  savePlan(plan: DailyPlan): Promise<void>;
}

export interface CareRepository {
  listDoctors(now: Date): Promise<Doctor[]>;
  listRequests(): Promise<ConsultRequest[]>;
  createRequest(request: ConsultRequest): Promise<void>;
  listAlerts(): Promise<Alert[]>;
  createAlert(alert: Alert): Promise<void>;
}

export interface ChatRepository {
  list(): Promise<ChatMessage[]>;
  /** Replaces the stored conversation (implementations may cap its length). */
  save(messages: ChatMessage[]): Promise<void>;
  clear(): Promise<void>;
}

export interface DataAdminRepository {
  /** Everything stored about the patient, for "Export my data". */
  exportAll(): Promise<Record<string, unknown>>;
  /** Deletes all patient data. */
  deleteAll(): Promise<void>;
  /** Replaces check-ins, sensors and feedback with a synthetic history (demo / onboarding). */
  replaceHistory(seed: SeedResult): Promise<void>;
}

export interface Repositories {
  patient: PatientRepository;
  checkIns: CheckInRepository;
  sensors: SensorRepository;
  interventions: InterventionRepository;
  care: CareRepository;
  chat: ChatRepository;
  admin: DataAdminRepository;
}
