import type { ISODate } from './dates';
import type { BodyHeat, BodyMap, BodyRegion, CheckIn } from './entities';

/**
 * Geometry of the body silhouette in a 200 × 400 box. The same rectangles are used to draw,
 * to hit-test a finger and to place the accessible buttons, so they can never drift apart.
 * "left" / "right" are the viewer's left and right.
 */
export const BODY_VIEWBOX = { width: 200, height: 400 } as const;

export interface RegionShape {
  id: BodyRegion;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Corner radius (w / 2 makes an ellipse-like shape). */
  r: number;
}

export const BODY_REGIONS: readonly RegionShape[] = [
  { id: 'head', x: 72, y: 6, w: 56, h: 64, r: 28 },
  { id: 'chest', x: 62, y: 78, w: 76, h: 70, r: 18 },
  { id: 'belly', x: 66, y: 152, w: 68, h: 50, r: 14 },
  { id: 'hips', x: 62, y: 206, w: 76, h: 40, r: 16 },
  { id: 'leftArm', x: 28, y: 82, w: 28, h: 100, r: 14 },
  { id: 'rightArm', x: 144, y: 82, w: 28, h: 100, r: 14 },
  { id: 'leftHand', x: 24, y: 186, w: 34, h: 34, r: 17 },
  { id: 'rightHand', x: 142, y: 186, w: 34, h: 34, r: 17 },
  { id: 'leftLeg', x: 64, y: 250, w: 32, h: 108, r: 14 },
  { id: 'rightLeg', x: 104, y: 250, w: 32, h: 108, r: 14 },
  { id: 'leftFoot', x: 54, y: 362, w: 44, h: 28, r: 12 },
  { id: 'rightFoot', x: 102, y: 362, w: 44, h: 28, r: 12 },
];

/** Region under a point given in view-box coordinates, or null. */
export function regionAt(x: number, y: number): BodyRegion | null {
  const hit = BODY_REGIONS.find((s) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h);
  return hit ? hit.id : null;
}

/** Brush: 1 warm, -1 cool, 0 erase. Returns a new map (the input is not changed). */
export function paintRegion(map: BodyMap, region: BodyRegion, brush: BodyHeat | 0): BodyMap {
  if ((map[region] ?? 0) === brush) return map;
  const next: BodyMap = { ...map };
  if (brush === 0) delete next[region];
  else next[region] = brush;
  return next;
}

export const isEmptyBodyMap = (map: BodyMap | undefined): boolean => !map || Object.keys(map).length === 0;

export const USUAL_MIN_ENTRIES = 2;
const USUAL_THRESHOLD = 0.34;

/**
 * The person's own usual map: per region, the average over their earlier maps (neutral = 0).
 * A region is "usually warm / cool" when the average is beyond ±0.34. Needs at least 2 maps.
 */
export function usualBodyMap(checkIns: CheckIn[], before?: ISODate): BodyMap | null {
  const maps = checkIns.filter((c) => !isEmptyBodyMap(c.bodyMap) && (!before || c.date < before)).map((c) => c.bodyMap as BodyMap);
  if (maps.length < USUAL_MIN_ENTRIES) return null;
  const usual: BodyMap = {};
  for (const { id } of BODY_REGIONS) {
    const mean = maps.reduce((sum, m) => sum + (m[id] ?? 0), 0) / maps.length;
    if (mean >= USUAL_THRESHOLD) usual[id] = 1;
    else if (mean <= -USUAL_THRESHOLD) usual[id] = -1;
  }
  return usual;
}

/** Regions that differ today from the usual map (for "today vs your usual"). */
export function changedRegions(today: BodyMap, usual: BodyMap): BodyRegion[] {
  return BODY_REGIONS.map((s) => s.id).filter((id) => (today[id] ?? 0) !== (usual[id] ?? 0));
}
