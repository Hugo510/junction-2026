# Hiillos demo personas — SYNTHETIC

> **v0.5 (14 Nov, 21:20): a step that helps now shows in that night's ring data.** On the night after a step that truly helps the person (walks for Aino, sound/fireplace for Juho), `average_hrv` ×1.15 and `hr_lowest` −1.5 bpm. Steps that don't help get no effect. Aino: nights after walks average 40.3 ms vs 36.8 ± 4.5 baseline (+0.80 SD) and vs 34.0 on her other recent nights (+1.43 SD); Juho: +0.61 / +1.59 SD. Only Aino's and Juho's `ring.json` change; every other value in every file is identical to v0.4 apart from `generatorVersion`. **Illustrative:** it lets the demo show the loop measuring a step's effect, not a claim that one walk raises HRV that night.
>
> **v0.4 (14 Nov, evening): new smart-ring layer** → `personas/<id>/ring.json` (one record per night). `core.json` is unchanged except `generatorVersion` (checked byte-for-byte on all other fields), so the app keeps working. See the section *Smart-ring layer (v0.4)* at the end.

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

## Smart-ring layer (v0.4)

**File:** `personas/<id>/ring.json` → `{"synthetic": true, "generatorVersion": "0.4", "units": {...}, "nights": [...]}`. Turn it off with `--no-ring`.

**One record per night.** The field names follow the **Junction sleep-summary shape**, which mirrors Oura, so a real Oura (or a Junction / Health Connect connection) can replace the file later without renaming fields:

| Field | Unit | Notes |
|---|---|---|
| `date` | local day | the evening the night started; **missing date = ring not worn / charging** |
| `bedtime_start`, `bedtime_end` | ISO time, Helsinki (+02:00) | |
| `duration`, `total`, `awake`, `light`, `deep`, `rem`, `latency` | seconds | `total` = asleep; `duration` = in bed |
| `efficiency` | 0–1 | |
| `hr_lowest`, `hr_average` | bpm | lowest HR ≈ resting HR |
| `average_hrv` | ms (RMSSD) | night average |
| `respiratory_rate` | breaths/min | |
| `temperature_delta` | °C | vs the person's own long-term average |
| `steps` | per day | from the existing `activityMinutes` story |

**The stories in ring data** (also in `ground_truth/<id>.json` → `"ring"`):
- **Aino:** from day 60, longer, later and more irregular sleep; HRV about −15 %; lowest HR +3; no temperature change. This is the mood drift.
- **Juho:** short, late, broken sleep; HRV −20 %; lowest HR +4; then partial recovery.
- **Elias:** flu peak 30 Oct. **Temperature up about +0.7–0.9 °C**, breathing rate +2.5, lowest HR +3–8, HRV down. This is the **fever signature**: the app can tell illness from mood, so no clinic alert.
- **Sara:** the ring is worn less and less. Missing data is not a mood signal.
- **Leena:** stays in her range; only charging gaps.

**How the numbers were chosen (calibration):**
- **Night-to-night noise and stickiness, from PMData.** PMData has 16 people, about 100 days each, Fitbit Versa 2. The source is Simula, CC BY 4.0, **statistics only, no data copied**, computed via a public processed daily file.

  | Measure (within one person) | Typical SD from night to night | Day-to-day stickiness (lag-1) |
  |---|---|---|
  | Resting HR | about 2 bpm | about 0.8 |
  | Lowest HR | about 3 bpm | — |
  | Sleep efficiency | about 2.6 points | — |
  | Time asleep | about 1 h | about 0 |
  | Steps | about 4,500 | about 0.1 |

  PMData people are very active (about 12,000 steps a day), so step levels here are set lower.
- **Direction of change.** HRV is lower in depression (group effect about g −0.46, Koch 2019). HRV falls with age (Fitbit, 8 M users, Natarajan 2020). Irregular sleep links to relapse (RADAR-CNS, PMID 39038618). See `docs/research/trigger_thresholds_pubmed.md`.
- **Illustrative, not calibrated:** every drift size, the HRV night-to-night CV (~15 %), and each person's baseline values.

**Why not real ring data?**
- **No open Oura population data.** The Oura API is OAuth-only (personal tokens ended Dec 2025) and limited to 10 users without Oura approval.
- **Oura's sandbox** paths (`/v2/sandbox/...`) still need a token.
- **Junction (the company) sandbox** gives synthetic Oura/Fitbit/HealthKit "demo connections". But it needs an API key, demo users are deleted after 7 days, and it only backfills 30 days, so it is not enough for 90-day personas. It is a good *integration demo* later.
- **Open datasets:**
  - **PMData** (Fitbit) — used for calibration.
  - **LifeSnaps** (Fitbit Sense, 71 people + mood check-ins) — check which Zenodo version is open.
  - **BiHeartS** (has real Oura 5-min HR/HRV, 148 nights) — access not checked.
  - None has depression relapse labels.

**Check before any real integration:**
- Oura's API & MCP Agreement (effective 8 June 2026) restricts feeding API data into AI. Reportedly, direct developers may do so with user consent, but aggregators may not. Hiillos's learning loop must fit this; read the agreement itself.
- Developer blogs report that Google switched off the Fitbit Web API on 2 Nov 2026 (move to the Google Health API). Check before building watch support on Fitbit.
