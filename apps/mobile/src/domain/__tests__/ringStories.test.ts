import { PERSONAS, rebasePersona } from '../../data/personas';
import { bodyResponse } from '../bodyResponse';
import { addDaysISO } from '../dates';
import type { SensorAggregate } from '../entities';
import { INTERVENTION_IDS } from '../interventions';
import { rankInterventions } from '../interventionPicker';
import { priorityScore } from '../priorityScore';
import { simulateWearable, wearableSummary } from '../wearable';

const TODAY = '2026-11-15';
const persona = (id: string) => {
  const p = PERSONAS.find((x) => x.persona.id === id);
  if (!p) throw new Error(`persona ${id} missing`);
  return rebasePersona(p, addDaysISO(TODAY, -1));
};
const withoutRing = (sensors: SensorAggregate[]): SensorAggregate[] =>
  sensors.map(({ nightHrvMs: _h, restingHr: _r, sleepMinutes: _s, wakeTime: _w, wearableSource: _x, ...rest }) => rest);

describe('smart-ring layer (generator v0.4) in the app', () => {
  it('every persona carries ring nights on its daily rows, under the app\u2019s field names', () => {
    for (const id of ['aino', 'leena', 'juho', 'elias']) {
      const rows = persona(id).sensors.filter((s) => s.nightHrvMs !== undefined);
      expect(rows.length).toBeGreaterThanOrEqual(75);
      expect(rows.every((s) => s.wearableSource === 'ring' && (s.sleepMinutes ?? 0) > 120 && (s.restingHr ?? 0) > 30)).toBe(true);
      expect(rows.every((s) => s.wakeTime === undefined || /^\d\d:\d\d$/.test(s.wakeTime))).toBe(true);
    }
  });

  it('Sara wears the ring less and less: missing nights stay missing, never a mood signal', () => {
    const sara = persona('sara');
    const worn = sara.sensors.filter((s) => s.nightHrvMs !== undefined).length;
    expect(worn).toBeLessThan(sara.sensors.length);
    expect(sara.sensors.some((s) => s.nightHrvMs === undefined && s.wearableSource === undefined)).toBe(true);
  });

  it('the ring does not change anyone\u2019s priority level on demo day', () => {
    for (const p of PERSONAS) {
      const data = persona(p.persona.id);
      const flags = { bipolar: p.persona.bipolarFlag };
      const ring = priorityScore({ checkIns: data.checkIns, sensors: data.sensors, today: TODAY, flags });
      const plain = priorityScore({ checkIns: data.checkIns, sensors: withoutRing(data.sensors), today: TODAY, flags });
      expect({ id: p.persona.id, level: ring.level }).toEqual({ id: p.persona.id, level: plain.level });
    }
  });

  it('Aino\u2019s night-time recovery is below her own usual on demo day (the body drift)', () => {
    const aino = persona('aino');
    const body = wearableSummary(simulateWearable({ checkIns: aino.checkIns, sensors: aino.sensors, today: TODAY }), TODAY);
    const week = body.recovery.week.reduce((a, b) => a + b, 0) / body.recovery.week.length;
    expect(week).toBeLessThan(body.recovery.usual as number);
  });

  it('reports what the body-loop numbers are today (for the demo script)', () => {
    const report = PERSONAS.map((p) => {
      const data = persona(p.persona.id);
      const top = (s?: SensorAggregate[]) => rankInterventions(INTERVENTION_IDS, data.feedback, data.checkIns, {}, s).find((r) => r.n > 0)?.id;
      const body = wearableSummary(simulateWearable({ checkIns: data.checkIns, sensors: data.sensors, today: TODAY }), TODAY);
      const topId = top(data.sensors);
      const response = topId ? bodyResponse(topId, data.feedback, data.sensors) : null;
      return {
        id: p.persona.id,
        topThumbs: top(),
        topWithBody: topId,
        bodyZ: response ? Math.round(response.z * 100) / 100 : null,
        recovery: `${body.recovery.latest} (usual ${body.recovery.usual})`,
        sleepH: `${body.sleep.latest} (usual ${body.sleep.usual})`,
        priority: priorityScore({ checkIns: data.checkIns, sensors: data.sensors, today: TODAY, flags: { bipolar: p.persona.bipolarFlag } }).score,
      };
    });
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(report, null, 1));
    expect(report).toHaveLength(5);
  });
});
