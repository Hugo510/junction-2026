# Memo — Hiillos closes the loop through the body

*SISU Lab · Sat 14 Nov 2026, 19:50 · from Meg · Spanish version: `MEMO_BODY_LOOP_ES.md`*
*Status: **watch decided** (Hugo and Uriel ready to add it). **Ring proposed** — add if the team agrees. Logged as O33 in `DECISIONS.md`.*

---

## 1. Why we are changing the story

We talked to the challenge team this evening. They were **not convinced by our "closed care loop"** (drift → questionnaire → clinic). They want a smartwatch, measuring continuously and more directly.

Reading their brief again, they mean a different loop from ours:

> Home maintenance treatment "could also be 'closed-loop', meaning that it is individualised based on how the brain of the patient reacts to the interventions."

That is the **stimulation sense** of closed loop: **measure the body or brain → intervene → measure the response → adjust.** The brief also names the device: smart rings measure heart signals, sleep, activity and the autonomic nervous system, "a very important indicator of mental state".

Our clinic loop stays, but as the **safety net**, not the headline.

## 2. The new loop (one line for judges)

**Hiillos offers one small step, watches how her body responds that night, and learns what really helps her.**

| Step | What happens | Source |
|---|---|---|
| **Sense** | Night-time heart rate variability, resting heart rate, sleep timing and length, steps, all against *her own* baseline | Watch (decided), ring (proposed) |
| **Respond** | One small step: walk, sea sounds, a message to a friend, wind-down… | App (exists) |
| **Measure the response** | That night's recovery (heart rate variability, sleep) vs her own normal, plus next day's mood tap | Watch or ring + app |
| **Learn** | The learning engine scores each step by *how her body and mood responded*, not just thumbs-up | App (small change, §4) |
| **Safety net** | Drift → two-question check → nine-question check → clinic only when it matters | App (exists) |
| **Anchor** | The clinic's EEG and TMS–EEG from treatment is her brain starting point | Clinic (pitch) |

## 3. Watch or ring?

| | Watch | Ring |
|---|---|---|
| Night data (heart rate variability, sleep) | Often taken off at night | Built for night wear: **cleanest night signal** |
| Daytime activity, steps | Strong | Good |
| Live heart rate on stage | Easy | Usually syncs later |
| Finnish angle | Polar | Oura |
| Watch-outs | Charging gaps break 24-hour rhythm | In one small validation (35 healthy adults, 1 night) the ring under-read heart rate variability by about 16 ms. Data goes through the vendor's cloud (terms not checked) |

**Proposal:** the watch for the demo, and the pitch says "any watch or ring through Health Connect / HealthKit". The ring is the best fit for night recovery, if the team agrees.

## 4. Build changes tonight (feature freeze 21:00)

| # | Change | Owner | ~time |
|---|---|---|---|
| B1 | **New optional fields** on `SensorAggregate`: `nightHrvMs` (night-time heart rate variability, root mean square of successive differences, ms), `restingHr` (beats per minute), `sleepMinutes`, `wakeTime` ("HH:mm"), `wearMinutes`, `wearableSource` ("watch" or "ring"). `bedtime` and `steps` already exist. *Names are a proposal — Hugo confirms.* | Hugo | 20 min |
| B2 | **Synthetic watch/ring data for the 5 personas.** Aino: walks → higher heart rate variability that night. Juho: sea sounds help, walks don't. Elias: flu week → resting heart rate up, heart rate variability down → reach-out → questionnaire low → no clinic alert. Leena: stable. Sara: gaps in wear → "lost contact", never relapse | Claude + Meg | 30 min |
| B3 | **Body response in the learning score** (`rewardFor` in `interventionPicker.ts`): today = rating + 0.25 × next-day mood change. Add **+ 0.25 × next-night heart rate variability vs her own 14-day baseline** (in standard deviations, capped at ±2). Weight is a tuning value, illustrative | Uriel | 45–60 min |
| B4 | **"What helps you" card says why:** "After walks, your night-time recovery was higher than your usual." No medical words | Hugo | 15 min |
| B5 | **Clinician screen:** a small heart-rate-variability and sleep trend vs her baseline next to the reasons. Sensors still never alert the clinic on their own | Uriel | 30 min |
| B6 | *Optional:* a **live heart rate** from a team member's watch on stage — shown only, not stored, with that person's consent. Needs a team yes, because the spec says no real data from team members | Hugo or Uriel | only if easy |

## 5. Pitch order (new)

1. Name story → radical frame ("Treatment doesn't end at discharge — it changes form").
2. **The body loop, live:** Aino takes a walk → her night recovery rises → Hiillos learns "walks help *you*". Juho: the opposite.
3. Elias: the body says "something's off" → Hiillos asks → the questionnaire says he's fine → **no false alarm to the clinic.**
4. Safety net: the clinic only when it matters, with a one-line reason.
5. **The ask to the lab:** home watch or ring data, paired with the clinic's EEG and TMS–EEG before and after treatment, person by person, between discharge and relapse. Something the lab doesn't have today.

## 6. What we must say honestly

- Heart rate variability is real but small at group level (effect size about −0.46). **Antidepressants lower it more than depression does**, so we only ever compare a person with herself, and reset the baseline when medication changes.
- **We have not researched** whether one night's heart rate variability response to a walk predicts anything about depression. We say *"learns what her body responds to"*, never *"treats"* or *"detects relapse"*.
- All demo data is **synthetic**. Effect sizes are **illustrative, not calibrated**.

## 7. One question for the lab tonight

**"Would home watch or ring data, paired with your EEG and TMS–EEG from treatment, be useful for your research?"** Their answer shapes the closing slide and the "most promising idea" prize.
