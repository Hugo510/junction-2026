import type { RiskAssessment } from './riskRules';

export interface QueueEntry {
  id: string;
  priority: number;
  enqueuedAt: string;
}

export class UrgentInNormalQueueError extends Error {
  constructor() {
    super('Urgent cases must use the urgent channel, never the normal queue.');
    this.name = 'UrgentInNormalQueueError';
  }
}

/** Adds an entry to the normal queue. Refuses urgent cases by design. */
export function enqueueNormal(queue: QueueEntry[], entry: QueueEntry, risk: RiskAssessment): QueueEntry[] {
  if (risk.level === 'urgent') throw new UrgentInNormalQueueError();
  return [...queue, entry];
}

/** Higher priority first; same priority → first come, first served. */
export function sortQueue(queue: QueueEntry[]): QueueEntry[] {
  return [...queue].sort((a, b) => b.priority - a.priority || a.enqueuedAt.localeCompare(b.enqueuedAt));
}

/** 1-based position, or 0 if not found. */
export function positionInQueue(queue: QueueEntry[], id: string): number {
  return sortQueue(queue).findIndex((e) => e.id === id) + 1;
}

/** Fictional other patients already waiting, used to simulate the queue. */
export function syntheticWaitingQueue(now: Date): QueueEntry[] {
  const t = (minAgo: number) => new Date(now.getTime() - minAgo * 60_000).toISOString();
  return [
    { id: 'synthetic-a', priority: 72, enqueuedAt: t(95) },
    { id: 'synthetic-b', priority: 48, enqueuedAt: t(60) },
    { id: 'synthetic-c', priority: 35, enqueuedAt: t(40) },
    { id: 'synthetic-d', priority: 20, enqueuedAt: t(15) },
  ];
}

export const MINUTES_PER_QUEUE_STEP = 40;
export const HOURS_PER_POSITION = 2;

export type QueueStatus = 'queued' | 'replied';

/** Simulated evolution: the queue advances one position every MINUTES_PER_QUEUE_STEP. */
export function simulateQueueProgress(
  initialPosition: number,
  createdAt: Date,
  now: Date,
): { position: number; etaHours: number; status: QueueStatus } {
  const elapsedMin = Math.max(0, (now.getTime() - createdAt.getTime()) / 60_000);
  const position = Math.max(0, initialPosition - Math.floor(elapsedMin / MINUTES_PER_QUEUE_STEP));
  if (position === 0) return { position: 0, etaHours: 0, status: 'replied' };
  return { position, etaHours: position * HOURS_PER_POSITION, status: 'queued' };
}
