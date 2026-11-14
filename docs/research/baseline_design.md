# Hiillos — how to build each person's "normal" (baseline design)

*14 Nov 2026. The figures come from Consensus search abstracts; the full papers were not read. Everything labelled "design" is the team's own choice, not a published protocol.*

## How many days are needed — evidence

| What we want to learn | Days needed for a reliable estimate | Source |
|---|---|---|
| Average daily activity (light, sedentary, moderate-to-vigorous) | **6–10 valid days**, aiming for 0.80 reliability. Methods based on short test-retest periods overestimate reliability. | Hilden et al. 2023, *PLoS ONE* (Fitbit, n=79, about 1 year) |
| Average sleep (Fitbit): total sleep time (TST) | **3–5 nights** for a weekly average; 5–10 nights for a monthly average | Lau et al. 2022, *SLEEP Advances* (n=1,041; 107,144 nights) |
| Average sleep (WHOOP): TST, sleep midpoint, sleep onset | **2–7 nights** (TST 7; onset and midpoint 3) | Leota et al. 2026, *SLEEP* (n=10,412; 3.7 M nights) |
| **Night-to-night variability** in sleep | **41–65 nights** (TST 43, midpoint 41, WASO 65). Variability estimated from 7–14 nights was unreliable (r 0.50–0.67). | Leota et al. 2026, *SLEEP* |
| Monthly variability in TST (Fitbit) | 11–18 nights | Lau et al. 2022 |
| Rest-activity rhythm (interdaily stability, intradaily variability) | **At least 7 full days**; under 7 days adds bias | Lok et al. 2024, *J Sleep Res* (n=41); Danilevicz et al. 2024 (5 days, older adults) |
| A "representative" picture of activity plus sleep | **More than 2 months**; seasonal patterns and the daylight-saving clock change appear in the data | Óskarsdóttir et al. 2021, *JMIR Form Res* (n=54, ages 52–86, 6 months) |
| HRV baseline | **Not found in this search.** Treat as at least as slow as sleep variability. Medication changes shift HRV. | — |

**Design reading of this evidence:** averages settle in about 1–2 weeks. Variability and rhythm measures need about 6–8 weeks. That matters because variability-type signals are the ones that predicted symptom transitions (step variability, sleep irregularity). See HIILLOS_TRIGGER_THRESHOLDS_PUBMED.md.

## Staged baseline (design)

| Phase | When | What Hiillos does |
|---|---|---|
| **0 · During TMS** | The 4–6 week TMS course (ring on from the first week) | Record how the person moves from ill to better: the "ill end" and the trajectory. Do not use this as "normal", because daily clinic visits create an artificial routine. |
| **1 · Averages** | Days 1–14 after TMS | Personal averages for steps, sleep time, sleep midpoint and time at home, kept **separate for weekdays and weekends**. Until there is enough data, blend in a population prior (a gradual shift from population to person, statistically called shrinkage). Sensors only adjust *how soft* the nudges are; no drift alerts yet. |
| **2 · Early drift** | Weeks 3–8 | Drift detection on averages switches on: a smoothed trend chart (EWMA) against personal limits. Variability metrics are still "learning". |
| **3 · Full personal model** | From about week 8 | Variability and rhythm metrics (sleep regularity, step variability, interdaily stability) are now reliable. Relapse risk after TMS peaks around months 3–6, so the full model is ready in time. |
| **Ongoing** | Every month | Update the baseline **only from periods confirmed as well** (PHQ-9 low, check-ins stable). **Never use a plain rolling window**: it would slowly absorb a relapse and treat it as the new normal. Keep a fixed "last known well" reference. Add flags for season, daylight saving and medication changes. |

## Other baseline sources Hiillos can use

1. **Health data already on the phone** (Apple Health / Google Health Connect step history, often going back years; previous Oura, Garmin or Fitbit history). These are imported **with consent**.
   - They allow a cold start from day 1.
   - **Caveat:** the months before TMS were very likely a depressed period. Label them as the **"ill signature"** (the opposite anchor), not as normal. If the history goes back far enough, look for an earlier well period.
2. **Clinic anchors at TMS discharge:** PHQ-9 (HUS already uses it at referral), MADRS/HAM-D, and the person's response level (remission vs partial response, which carries a different relapse risk).
3. **"Relapse signature" interview at discharge:** how the person's previous episodes started, and whether their sleep and appetite go *up* or *down* when they are unwell. This sets the direction of each signal per person. Prodromes tend to repeat within a person (see the symptoms-and-signals report).
4. **The person's own description of a good week:** usual bedtime, a walking route, work days. This is a cheap prior for the model.
5. **Population norms** for steps and sleep by age and sex, used only as the starting prior and as a backup check (e.g. under 5,000 steps a day).
6. **Context baselines:** separate weekday and weekend baselines, working vs not working (time at home differs by about 3 hours a day; RADAR-CNS), Finnish seasonal daylight, and the daylight-saving switch.
7. **During-TMS clinic signals** (research layer): resting EEG and heart rate in the clinic at the start and end of the course. These can serve as a reference for a later portable-EEG or HRV trend.

## For the demo

Use the synthetic personas (claude/synthetic) to show all four phases on screen. Show the prior shifting from population to person, then the drift chart, then a nudge, then the extra check-in. Say openly that the data are simulated.
