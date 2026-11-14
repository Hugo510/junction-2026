import { BODY_REGIONS, BODY_VIEWBOX, changedRegions, isEmptyBodyMap, paintRegion, regionAt, usualBodyMap } from '../bodyMap';
import type { BodyMap, CheckIn } from '../entities';

const entry = (date: string, bodyMap?: BodyMap): CheckIn => ({
  id: date,
  date,
  createdAt: `${date}T20:00:00.000Z`,
  mood: 3,
  safetyConcern: false,
  bodyMap,
});

describe('body map', () => {
  it('has 12 regions that fit the silhouette box and do not overlap', () => {
    expect(BODY_REGIONS).toHaveLength(12);
    for (const s of BODY_REGIONS) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x + s.w).toBeLessThanOrEqual(BODY_VIEWBOX.width);
      expect(s.y + s.h).toBeLessThanOrEqual(BODY_VIEWBOX.height);
      // the centre of every region hits only that region
      expect(regionAt(s.x + s.w / 2, s.y + s.h / 2)).toBe(s.id);
    }
    expect(regionAt(2, 2)).toBeNull();
  });

  it('paints warm, cool and erases without changing the input', () => {
    const empty: BodyMap = {};
    const warm = paintRegion(empty, 'chest', 1);
    expect(warm).toEqual({ chest: 1 });
    expect(empty).toEqual({});
    expect(paintRegion(warm, 'chest', 1)).toBe(warm); // no change → same object (no re-render)
    expect(paintRegion(warm, 'chest', -1)).toEqual({ chest: -1 });
    expect(paintRegion(warm, 'chest', 0)).toEqual({});
    expect(isEmptyBodyMap(paintRegion(warm, 'chest', 0))).toBe(true);
  });

  it('builds the usual map from the own earlier maps', () => {
    const history = [
      entry('2026-11-01', { chest: 1, leftLeg: -1, rightLeg: -1 }),
      entry('2026-11-08', { chest: 1, leftLeg: -1, head: 1 }),
      entry('2026-11-10'), // no map: ignored
    ];
    // chest 2/2 warm, leftLeg 2/2 cool, rightLeg 1/2 cool (-0.5), head 1/2 warm (0.5)
    expect(usualBodyMap(history)).toEqual({ chest: 1, head: 1, leftLeg: -1, rightLeg: -1 });
    expect(usualBodyMap(history.slice(0, 1))).toBeNull(); // needs at least two maps
    expect(usualBodyMap(history, '2026-11-08')).toBeNull(); // only earlier days count
  });

  it('tells what is different today', () => {
    expect(changedRegions({ chest: -1, head: 1 }, { chest: 1, head: 1 })).toEqual(['chest']);
  });
});
