# Hiillos demo personas — SYNTHETIC

All five people and all of their data are invented. Effect sizes are illustrative, not calibrated to real patients.

- **Format:** `apps/mobile/src/data/personas/core.schema.json` (Hugo). All 5 files validate against it.
- **Dates:** 90 days, 2026-08-17 → 2026-11-14 (the day before the Sunday demo). To regenerate or shift (from the repo root): `python3 tools/synthetic/generate_personas.py --out tools/synthetic/personas --truth tools/synthetic/ground_truth --end YYYY-MM-DD`. Add `--extended --out tools/synthetic/personas_extended` for the extended set.
- **Generator:** `generate_personas.py`, version 0.1, seed 2026 (+ persona index). It is deterministic: the same command gives the same files.
- **Ground truth** (`ground_truth/<id>.json`): when each drift starts, what truly helps, and what to expect on demo day. **The app does not read it.**

## Checked with the app's own code (`hugo/mobile` @ 7796c1e), demo day 2026-11-15

| Persona | Priority on demo day | Outreach | Embers | "Learned" ranking (bandit) |
|---|---|---|---|---|
| Aino (fi) | **70 high**: mood drop, below her baseline, low mood, activity drop, long sleep | none | steady | daylightWalk > breathing > fireplace |
| Leena (sv) | 0 low | none | bright | daylightWalk ≈ gratitude > breathing |
| Juho (fi) | 0 low (recovered); was **medium 30–35** on 18–24 Oct | none | bright | **fireplace > breathing > daylightWalk** (the opposite of Aino) |
| Sara (sv) | 15 low (missed check-ins only) | **reconnect** (silent since 6 Nov) | low (floor holds) | — |
| Elias (en) | 0 low; was **medium 35** on 4 Nov (flu week), never high | none | bright | daylightWalk > move > fireplace |

Earlier demo dates worth knowing: Aino reaches **medium 30 on 24 Oct** (first drift) and **55 on 9 Nov**. Elias's flu week is 29 Oct – 4 Nov.

## Extended version (`--extended`, folder `personas_extended/`)

Same people, same days, same check-ins and feedback, plus three things a phone can measure or ask without any wearable:

- `sensors[].homeMinutes`: minutes at home per day (phone geofence, no coordinates stored). Aino: ~900 normally, ~1,280 in her last week.
- `sensors[].screenOffTime`: last screen-off of the evening, "HH:MM" (a proxy for bedtime). Aino: ~23:00 normally, ~00:40 in her last week.
- `phq9[]`: `{date, items[9], total}` every 14 days plus extras when Hiillos reaches out. Item 9 is always 0 in demo data. Aino: 6 → 9 → 7 → **11 → 12** (two checks a week apart, both ≥ 10 and ≥ 5 above her discharge score → "call" list under spec §7). Juho peaks at 11 once ("watch", not "call"). Elias's flu week: 7 (no call).

These files do **not** validate against today's `core.schema.json` (`additionalProperties: false`). They need, in `entities.ts` + the schema:

```ts
// SensorAggregate
homeMinutes?: number;      // 0–1440
screenOffTime?: string;    // "HH:MM" local
// new
export interface Phq9 { date: ISODate; items: number[]; total: number }  // items: 9 × 0–3
// SeedResult / Persona
phq9?: Phq9[];
```

## Limits (say so if asked)

- In the base files (today's schema) "stays home / sleeps later" show only as lower daylight and activity, more sleep and irritable emotions. The extended files carry the direct signals.
- There is no music intervention id yet; `fireplace` stands in for sound/music in Juho's story.

## Registering the files (Hugo)

The files live here in `tools/synthetic/personas/` on `main`. Copy them into the app on `hugo/mobile`:

```sh
cp tools/synthetic/personas/*.json apps/mobile/src/data/personas/
```

Then in `apps/mobile/src/data/personas/index.ts`:

```ts
const PERSONA_FILES: unknown[] = [
  require('./aino.json'),
  require('./leena.json'),
  require('./juho.json'),
  require('./sara.json'),
  require('./elias.json'),
];
```
