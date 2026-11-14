# Hiillos demo personas — SYNTHETIC

All five people and all of their data are invented. Effect sizes are illustrative, not calibrated to real patients.

- **Format (v0.3, 14 Nov 10:50):** Hugo's `apps/mobile/assets/personas/core.schema.json` (`hugo/mobile` @ 10:39). One folder per persona: `personas/<id>/core.json`, top-level `"synthetic": true`, `generatorVersion`, `seed`, `persona.label`. All 5 validate against the schema and load with the app's own `parsePersona` + `rebasePersona`.
- **Signals included:** check-ins (mood, emotions, energy, anxiety, sleep), sensors (`activityMinutes`, `daylightMinutes`, `homeMinutes`, `screenOffTime`), "did it help?" feedback, and `phq9` (9 items, item 9 always 0 in demo data).
- **Dates:** 90 days, 2026-08-17 → 2026-11-14. The app rebases the dates so the last day lands on "yesterday", so the files work on any demo day.
- **Generator:** `generate_personas.py`, version 0.3, seed 2026. Deterministic: the same command gives the same files.
  ```sh
  python3 tools/synthetic/generate_personas.py --out tools/synthetic/personas --truth tools/synthetic/ground_truth
  ```
  `--minimal` leaves out `homeMinutes`, `screenOffTime` and `phq9` (older app format).
- **Ground truth** (`ground_truth/<id>.json`): when each drift starts, what truly helps, what to expect on demo day. **The app does not read it.**

## Into the app (Hugo)

```sh
cp -r tools/synthetic/personas/* apps/mobile/assets/personas/
```

Then in `apps/mobile/src/data/personas/index.ts`:

```ts
const PERSONA_FILES: unknown[] = [
  require('../../../assets/personas/aino/core.json'),
  require('../../../assets/personas/leena/core.json'),
  require('../../../assets/personas/juho/core.json'),
  require('../../../assets/personas/sara/core.json'),
  require('../../../assets/personas/elias/core.json'),
];
```

## Checked with the app's own code (`hugo/mobile` @ dfd5786, 10:39), demo day 2026-11-15, after rebasing

| Persona | Priority | Outreach | PHQ | "Learned" (bandit, top 2) |
|---|---|---|---|---|
| Aino (fi) | **70 high**: mood drop, below her baseline, low mood, activity drop, long sleep | none | PHQ-9 6 → 9 → 7 → **11 → 12**; `hasPhqConcern` = **true** (suggest the care team) | daylightWalk > breathing |
| Leena (sv) | 0 low | none | 2–4 throughout | daylightWalk > gratitude |
| Juho (fi) | 0 low (was **medium 30–35** on 18–24 Oct) | none | peaks at 11 once (watch, not call) | **fireplace > breathing** (walks last) |
| Sara (sv) | 25 low (missed check-ins, activity drop — no mood alarm) | **reconnect** (no check-in for 7 days; phone still logging) | — | breathing > daylightWalk |
| Elias (en) | 0 low (was **medium 35** on 4 Nov, flu week), never high | none | 7 in the flu week (no call) | daylightWalk > move |

Aino's last week vs her normal: time at home ~1,300 vs ~900 minutes, screen off ~00:40–01:00 vs ~23:00.

## Limits (say so if asked)

- There is no music intervention id yet; `fireplace` stands in for sound/music in Juho's story.
- Day-to-day noise is random but fixed by the seed; effect sizes are invented for the demo.
