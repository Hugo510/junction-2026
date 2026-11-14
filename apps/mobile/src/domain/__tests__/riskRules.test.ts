import { generateHistory } from '../../data/seed';
import { enqueueNormal, positionInQueue, simulateQueueProgress, syntheticWaitingQueue, UrgentInNormalQueueError } from '../consultQueue';
import { priorityScore } from '../priorityScore';
import { assessCheckInRisk, routeToChannel } from '../riskRules';

describe('riskRules', () => {
  it('a safety "yes" is always urgent, even with a perfect history', () => {
    const h = generateHistory('good', '2026-11-13');
    const priority = priorityScore({ checkIns: h.checkIns, sensors: h.sensors, today: '2026-11-14' });
    expect(priority.level).toBe('low');

    const risk = assessCheckInRisk({ safetyConcern: true });
    expect(risk.level).toBe('urgent');
    expect(routeToChannel(risk, priority)).toBe('urgent');
  });

  it('no safety concern goes to the normal queue', () => {
    expect(routeToChannel(assessCheckInRisk({ safetyConcern: false }))).toBe('normalQueue');
  });

  it('urgent never enters the normal queue', () => {
    const queue = syntheticWaitingQueue(new Date('2026-11-14T12:00:00Z'));
    const entry = { id: 'me', priority: 100, enqueuedAt: '2026-11-14T12:00:00Z' };
    expect(() => enqueueNormal(queue, entry, { level: 'urgent', reasons: [] })).toThrow(UrgentInNormalQueueError);
    expect(queue.find((e) => e.id === 'me')).toBeUndefined();
  });
});

describe('consultQueue', () => {
  const now = new Date('2026-11-14T12:00:00Z');

  it('orders by priority, then arrival', () => {
    const queue = enqueueNormal(
      syntheticWaitingQueue(now),
      { id: 'me', priority: 50, enqueuedAt: now.toISOString() },
      { level: 'none', reasons: [] },
    );
    expect(positionInQueue(queue, 'me')).toBe(2);
    expect(positionInQueue(queue, 'synthetic-a')).toBe(1);
  });

  it('a higher score moves the patient up', () => {
    const queue = enqueueNormal(
      syntheticWaitingQueue(now),
      { id: 'me', priority: 85, enqueuedAt: now.toISOString() },
      { level: 'none', reasons: [] },
    );
    expect(positionInQueue(queue, 'me')).toBe(1);
  });

  it('advances over time until replied', () => {
    expect(simulateQueueProgress(3, now, now)).toEqual({ position: 3, etaHours: 6, status: 'queued' });
    const later = new Date(now.getTime() + 85 * 60_000);
    expect(simulateQueueProgress(3, now, later).position).toBe(1);
    const muchLater = new Date(now.getTime() + 5 * 3_600_000);
    expect(simulateQueueProgress(3, now, muchLater).status).toBe('replied');
  });
});
