# Hiillos — build spec for the Junction demo

*SISU Lab · Junction 2026 · challenge "Beyond the Clinic" (Aalto)*
*v3 — Sat 14 Nov 2026, ~10:30: **new §W "How we win"** (vision, mission, the four criteria → four proofs, re-ranked build order, cut list, pitch skeleton). §0, §3, §4, §9, §10 updated to match. Backend found on branch `owais/backend`; `main` is still empty (see W6). v2.2 (~10:15) added the 5th persona and §13. v2.1 (~10:05) added the repo check §12. v1 was 07:40.*
*Read §W first (3 min). The rest is the reference spec.*

---

## W. How we win

### W1. The situation

Preliminary submissions: **Beyond the Clinic has 49 projects**, one of the most crowded challenges (only Trusted Trade Agents, AI Glasses, Make Blueprints Talk, Decode the Noise, Spread and Break the Agent have more). Judging is **4 × 25%**: usefulness, ease of use, smart sensing, creativity.

What that means for us *(this is our reading, not something we know)*:
- Many of the 49 will probably build **"mood tracker + chatbot + wearable data"**. Being good at that is not enough to stand out.
- With four equal criteria, **our weakest criterion caps our score**. Right now our weak spots are the ones judges *see*: the fire is not on the home screen (creativity), the learning loop is built but invisible (smart sensing), and there is no clinician view (usefulness).
- The judges are **TMS / brain-stimulation researchers** (Ilmoniemi and Lioumis groups) plus Aalto Innovation. The brief's own words are **"closed loop: sense → respond → learn what works for that person"**. We speak exactly that language, and we show all three steps working.
- Besides the €2000 prize, there is a separate prize for **"the most promising idea" — a chance to keep developing it with the researchers**. That is the prize that leads to a company. Pitch for both.

### W2. Vision, mission, promise

**Name story (the pitch opens with this):**
> *TMS lights the fire. When the daily visits end, the fire burns down — and that's when depression can come back. **Hiillos** is Finnish for the glowing embers that keep the warmth after the flames are gone. Hiillos keeps the embers glowing.*

**Vision**
> **Nobody falls out of care just because they went home.**

**Mission**
> Hiillos keeps people inside a closed care loop after depression treatment — so they get more out of the treatment they had, stay connected to their life and their clinic, and stay well. It learns each person's own normal, reaches out first when the days start to drift, offers one small thing that has worked for *them* before, and brings in a human only when it matters.

**Two promises**
- **To the person:** *You don't have to remember Hiillos. Hiillos remembers you.* One tap a day. On a bad day it comes to you — and the embers never go out.
- **To the clinic:** *Only the calls that matter, each with a one-line reason.* Sensors ask, questionnaires decide, humans confirm.

**Positioning:** not (yet) a medical device — a wellness companion today, with a deliberate medical-device path later (clinician view, relapse detection). That path is part of the investment story, not this weekend's demo.

### W3. The four criteria → four proofs (every demo moment earns one)

| Criterion (25% each) | Judges' question | Our proof — what they **see** on screen | Status |
|---|---|---|---|
| **Usefulness** | Could it really help people stay well at home? | Aino's drift is caught **2 weeks before** her PHQ-9 crosses 10 → one small action → the clinic gets her on the "call" list with a one-line reason, early enough for the clinic to consider a booster. Plus Elias: **no** false alert to the clinic. | Clinician view **missing** · PHQ-9 **missing** |
| **Ease of use** | Would someone recovering from depression actually use it every day? | **One tap, ~3 seconds a day.** Hiillos reaches out first (banner). Bad days are met with kindness: the fire never dies, silence gets a warmer message, not a warning. Say the number out loud: "one tap a day". | Reach-out banner **missing** · silence ladder **missing** · 1-tap exists |
| **Smart sensing** | Clever use of home measurements, and learns what works for each person? | **Her own baseline, both directions** (too much *and* too little sleep); time at home vs her own average (the strongest early-warning signal in our research). Then a **"What Hiillos has learned about Aino"** card: *walks lift her mood, sea sounds don't* — and for Juho the opposite. That card is the closed loop made visible. | Baseline + bandit **built** · "learned" card **missing** |
| **Creativity** | How original and delightful? | **The fire is the home screen**: it grows with self-care, never with the risk score, and the embers never go out. Hiillos is **quiet when you're well** (Leena) — an app that doesn't chase engagement. The name story. | Fire exists only as an exercise · rename "Valo" → Hiillos **not done** |

**The one screen to aim for:** the home screen with the fire in the background, today's one-tap check-in, and a small "learned" line underneath. If a judge remembers one image, it should be that one.

### W4. Build order — re-ranked by points per hour

*Hour figures are rough guesses — re-estimate as a team.*

| # | Item | Criterion it earns | Owner | ~h |
|---|---|---|---|---|
| 1 | **Rename Valo → Hiillos** (`app.json` name/slug/scheme, locales, README) | Creativity (brand) | Hugo | 0.5 |
| 2 | **Persona picker + load 5 × 90-day `core.json`** (unblocks everything below; Hugo confirms the §12.3 schema, Meg + Claude generate the files) | All | Hugo · Meg | 2–3 |
| 3 | **Fire as home background**, grows with self-care, floor so embers never go out (reuse `exercise/fireplace.tsx`) | Creativity · Ease | Hugo | 2 |
| 4 | **Clinician view**: 5 personas sorted by `priorityScore`, status, last PHQ-9, one-line reason, urgent badge | Usefulness | Hugo / Uriel | 2–3 |
| 5 | **"What Hiillos has learned" card** — read the existing `interventionPicker` bandit, show the top 2 actions in plain words | Smart sensing | Uriel | 1 |
| 6 | **Reach-out banner** on *Advance 1 day* when signals are outside her own range 5 of 7 days | Ease · Smart sensing | Hugo | 1 |
| 7 | **PHQ-9** triggered at medium priority; item 9 → existing safety rule; rules from §7 | Usefulness | Uriel · Meg (wording fi/sv/en) | 2–3 |
| 8 | **Silence ladder 2/4/7** + trusted friend (stored on the phone) | Ease · Usefulness | Hugo | 1–2 |
| 9 | **Sea sounds** (one CC0 audio file, source logged) | Creativity | Hugo | 0.5 |
| 10 | "Where are you right now?" screen with the 4 paths; only "just finished treatment" works, the other 3 show "coming next" — it shows the vision is bigger than TMS | Usefulness (vision) | Hugo | 0.5 |
| 11 | Backend: safety report never blocked by the 409 (O1); one live call in the demo (O10) | Usefulness (trust) | Owais | 1 |

### W5. Cut or move to the roadmap slide (they don't earn points this weekend)

PostgreSQL (in-memory is fine for the demo) · FHIR layer 2 (one line on the roadmap slide: "FHIR-ready, EU patient-summary mapping next") · Path C screens · EEG card unless it is ready with zero extra work · nature video (sea sounds is enough) · Gemini/LLM (keep `MockCompanionService`) · real push · camera pulse.

### W6. Don't lose points on the basics

- **Final submission is due Sun 10:00.** Friday's preliminary text is out of date: it spells the name "Hiilos", still mentions face/eye tracking, and still describes bee/cat companions. Rewrite it from W2 + W3 on Saturday evening, not on Sunday morning.
- **Merge both branches into `main` before the deadline.** Right now `main` has only the initial commit; the app is on `hugo/mobile`, the backend on `owais/backend`. Judges who open the repo see an empty project. Add a README with: one-line pitch, how to run, team, "all data synthetic".
- **Demo runs without the network** (personas loaded from local files, crisis numbers built in). Show one live backend call only if the venue Wi-Fi holds — have a screen recording of the full demo as backup.
- **Don't demo between 00:00 and 02:00 Helsinki time** (time zone bug, O8).
- **Say "synthetic" once, early**, and "effect sizes are illustrative, not calibrated" if asked.
- Rehearse the demo **with a stopwatch**. Check the Junction schedule for the exact pitch length and format, and whether there is a finalist round — we don't know yet.

### W7. Pitch skeleton (fit to the official time once known)

1. **Hook — the name story** (W2). The problem in one line: treatment ends, the daily contact ends, and that's when the risk returns.
2. **Aino's 90 days, live** — usefulness + smart sensing + ease, in that order (demo steps §3).
3. **Elias — the false alarm that never reaches the clinic.** "We don't flood clinicians."
4. **The loop on one slide:** Sense → Ask → Act → Learn → Clinic only when it matters. Same words as the brief.
5. **Why us / what's next:** the 4 care paths (not just TMS), the roadmap (real sensors via Health Connect / HealthKit, FHIR, MDR path), architecture that's extendable, integrable, embeddable, scalable.
6. **The ask to the lab (for "most promising idea"):** Hiillos can give the lab something it doesn't have today — what happens between discharge and relapse, person by person, and which home actions help which people. *Wording to check with the mentors before the pitch.*
7. **Closing slide = the four criteria with our four proofs** (W3), so judges can score us straight from the slide.

---

## 0. Where we are now (Sat morning)

**Built — backend (Owais, branch `owais/backend`, last commit 08:40):** FastAPI under `/api/v1`: `GET /health`, `POST /auth/demo-login` (demo patient + doctor tokens), `GET/PATCH /me`, `PUT /me/consents`, problem+json errors, `POST /checkins` with the self-harm rule, 7-day priority score with reasons, and a `suggestConsultation` flag. Storage is in memory until PostgreSQL.

**Built / agreed — app (Hugo, branch `hugo/mobile`, last commit 09:35; Expo/TypeScript, iOS + Android via Expo Go):** mock repositories (easy switch to the real API), 0–100 explainable priority queue, consent per sensor, 4 languages, companion animals. Hugo's answers (09:41):

| # | Topic | Decision |
|---|---|---|
| 1 | Name | **Hiillos** (two l's) everywhere — app, challenge text, pitch |
| 2 | Reaches out first | Simulated in-app notification in demo mode; companion opens each day with a check-in invite. Real push = roadmap |
| 3 | Escalation ladder | Trusted friend (stored only on the phone, one-tap call/message); helpline in the crisis screen; **silence rule 2 / 4 / 7 days** → warmer message → suggest friend → helpline / care team. 112 only via the safety path |
| 4 | Fireplace | Background of chat/home; **flames grow with self-care** (check-ins, small actions), not the priority score. Priority stays for clinicians |
| 5 | Comfort actions | Sea sounds + nature video (CC0 files). 3D music meditation = roadmap |
| 6 | Personas | **5 personas × 90 days as `core.json` files**, persona picker in demo mode. App does not read `ground_truth/` |
| 7 | Camera pulse | Roadmap (not possible in Expo Go) |
| 8 | EEG | Only if Uriel/Owais have an endpoint by Sunday morning; shown as an "experimental, not diagnostic" card |

**`main` branch:** only the initial commit (13 Nov 14:56). Nothing merged yet — see W6.

**Blocked:** the synthetic data generator needs Hugo to **confirm the `core.json` schema** drafted from the repo in §12.3.

## 1. What we are building (one line)

**An active companion that keeps a person inside a closed care loop after depression treatment: it learns their own baseline, notices drift early, reaches out first with one small action, and tells the clinic only when it matters.**

Not "an app you have to remember to open". A depressed person may not get out of bed — **Hiillos reaches out first.** Vision and mission: §W2.

## 2. Guardrails (non-negotiable, also for the demo)

1. **Not (yet) a medical device.** No diagnosis words in the UI. No "you have depression / relapse".
2. **Never advise starting, stopping or changing medication.** Record, remind, connect.
3. **Sensors only *prompt* a question. Questionnaires *decide*. Humans *confirm*.** No clinician alert from sensor data alone.
4. **Self-harm answer is a fixed rule**, not a model: crisis screen immediately + clinician alert.
   - A safety report is **always accepted**, even if a check-in already exists that day (the one-check-in-per-day 409 must not block it).
   - Crisis numbers come from the API, **but the app keeps a cached copy and always has 112 built in**, so a server or network failure never leaves the screen empty.
   - **112** (emergency) · **MIELI Crisis Helpline 09 2525 0111** (Finnish, 24/7). Swedish and English lines have limited hours — check mieli.fi before the demo.
5. **Compute on the phone, send scores.** Raw location / app usage never leaves the device (Owais).
6. **Silence is not relapse.** Day 7 of the silence rule reads as "lost contact", not crisis. Contacting the care team after silence needs consent given at onboarding.
7. **All demo data is SYNTHETIC** and labelled so.

## 3. The demo story (what judges see, ~2.5 min) — each step tagged with the criterion it proves

Persona **Aino, 42**, finished a TMS course at the clinic 4 weeks ago.

1. **Onboarding** *(Usefulness — the vision is bigger than TMS)*: "Where are you right now?" → 4 paths shown → *I've just finished treatment at the clinic.* Clinic data pre-loaded (discharge PHQ-9 = 6, her early signs: sleeps later, stays home, irritable).
2. **Normal days** *(Ease · Creativity)*: the fire glows on the home screen; one-tap check-in (~3 s); a small everyday suggestion. **The embers always glow** — there is a floor the fire never drops below, and it changes slowly, so a struggling person never watches it die.
3. **Week 3 drift** *(Smart sensing · Ease)*: time at home up and bedtime later than *her own* baseline for 5 of 7 days → Hiillos **reaches out** (banner): "Noticed the week's been heavier. Two quick questions?" → triggers a PHQ-9.
4. **Small action + learning** *(Smart sensing)*: offers one action (short walk outside, or sea sounds); she does it; mood tap afterwards improves → the **"What Hiillos has learned about Aino"** card updates: *walks help, sea sounds less so*. One tap on the persona picker → Juho's card says the opposite.
5. **Two weeks later PHQ-9 = 12** (≥10 and +6 vs her baseline, twice) *(Usefulness)* → **clinician view**: Aino moves to the "call" list with a one-line reason: *"PHQ-9 6 → 12 over 2 checks; home time +40%, bedtime +1h20 vs her baseline."* Booster TMS is an option for the clinic to decide.
6. **False alarm** *(Usefulness — low clinician load)* (15 s, persona picker → Elias): a week of flu pushes his signals out of range → Hiillos reaches out → PHQ-9 stays low → kind reply, **no clinician alert**. "Sensors ask, questionnaires decide — we don't flood clinicians."
7. **Safety (simulated)** *(Usefulness — trust)*: self-harm answer → crisis screen + alert, shown in 10 seconds.

## 4. Scope (re-ranked in v3 — build order in §W4)

| Priority | Feature |
|---|---|
| **P0 (must demo)** | Rename to Hiillos · Persona picker loading `core.json` · **Fire as home background** with ember floor · Personal baseline + drift score · Simulated reach-out banner + one-tap check-in · **"What Hiillos has learned" card** (moved up from P1 — the bandit is already built) · PHQ-9 incl. crisis path · Rule engine (§7) · Clinician view: list with status, last PHQ-9, reason · Silence ladder 2/4/7 · Action card (walk, friend, sea sounds) + "did it help?" · "Where are you right now?" screen (1 of 4 paths live) · Branches merged to `main` + README |
| **P1 (if time)** | Nature video · Backend live call in the demo · Path C screens ("I stopped my treatment") · EEG "experimental" card (only if ready with no extra work) |
| **Roadmap slide** | Real push notifications · camera pulse · 3D music meditation · real sensor collection (Health Connect / HealthKit / Polar) · FHIR export + Synthea-scale clinical data · EHR/Kanta integration · PostgreSQL in production · medical-device (MDR) path |
| **Out** | Real accounts, voice, camera/pupil, app-usage tracking, any ML diagnosis, LLM chat in the demo |

## 5. Patient status (data model core)

`path`: **A** not in care · **B** on treatment · **C** feeling better, treatment stopped
`state`: A0 not in care · A1 self-check · A2 waiting · B1 acute · B2 continuation · B3 maintenance · **B5 post-TMS (demo)** · C1 planned taper · C2 self-stopped · C3 therapy ended · C4 lost contact · C5 discharged
Also: `state_source` (clinician | self), `episode_count`, `depression_context` (primary | secondary), `treatments[]`, `stopped[]`, `care_team[]`, `if_worse`, `check_in_cadence`, `next_review`, `crisis_flag`.

Other entities: `DailySignals`, `CheckIn` (1-tap), `PHQ9`, `Action`, `ActionOutcome`, `Alert`.

## 6. Synthetic data — two layers, one persona ID

All of it is invented. **The size of each change (e.g. "bedtime +1h20") is illustrative, not calibrated to real patients** — say so in the README and the pitch. Ask the mentors for an open dataset to calibrate against later.

### Layer 1 — Daily life (P0)

- **Personas × days:** 5 × 90 days (Hugo; 5th persona decided by Meg 14 Nov).
- **Per day:** bedtime + regularity, sleep duration, steps, % time at home, places visited, night-time phone use, daytime light, 1–2 item mood check-in, HRV (weak, optional).
- **Baseline:** first 14–28 days. **Drift:** two-sided (too much *or* too little sleep), per person; direction from the person's own early signs. Strongest early-warning evidence: **time at home vs own average** (predicted symptoms 2 weeks ahead in a 1,013-person study).
- **Output:** one `core.json` per persona in the format Hugo's app reads (**schema: see §12.3**), plus `ground_truth/<persona>.json` (when drift starts, what helps — for tests and the pitch, not read by the app) and `ABOUT.md`.
- **Every file:** `synthetic: true`, generator version, random seed.
- **Generator** lives in the team repo (`tools/synthetic/`), Python, small and readable.

**Personas (decided — details in `PERSONAS.md`):**

| # | Persona | What it shows | Criterion |
|---|---|---|---|
| 1 | **Aino** (B5, post-TMS) | Drift caught early; walks help → the demo story | Usefulness · Smart sensing |
| 2 | **Leena** — stays well | Baseline holds; fire grows; no alerts — Hiillos is quiet when it should be | Creativity · Ease |
| 3 | **Juho** — music, not walks | Drift where sea sounds/music help and walks don't → the learning loop | Smart sensing |
| 4 | **Sara** — patchy data | Gaps in wear and check-ins → silence ladder 2/4/7, "lost contact", no false alarm | Ease · Usefulness |
| 5 | **Elias** — false alarm | Signals leave own range for a week (flu, travel, deadline) → reach out → PHQ-9 stays low → no clinician alert | Usefulness (low clinician load) |

*Considered and parked: path C2 self-stopped ("I felt fine, so I stopped") — good for a later Path C demo.*

### Layer 2 — Clinical record (roadmap in v3)

The clinician side: what the clinic knows (diagnosis, TMS course, discharge PHQ-9, follow-ups) as **HL7 FHIR**, linked to layer 1 by the same persona ID. The clinician view reads it; Hiillos writes its PHQ-9 and drift summary back as FHIR.

- **Demo:** moved to the roadmap slide in v3 (W5). If someone has a free hour on Sunday: a few hand-written FHIR resources per persona.
- **Scale step (pitch):** **Synthea** generates whole synthetic patient histories as FHIR. Its software is Apache-2.0 and the project states its distributed synthetic data is public domain (check the repo LICENSE before committing a generated sample). Caveats: TMS is likely not built in (a custom module would be needed — unverified); output follows the US Core profile, not the EU International Patient Summary; needs Java 17.
- **Pitch wording:** "FHIR-ready, EU patient-summary mapping next" — not "EU-ready".

### Later — real data routes (roadmap slide)

The app runs on iOS and Android, so a phone-side route needs **Health Connect (Android) and HealthKit (iOS)**. Wearable options: Polar AccessLink (Finnish; "free, self-serve" claim is from 2017 — verify), Thryve (German-hosted aggregator; access by demo booking — verify). No real data from team members this weekend (GDPR special-category data).

## 7. Rule engine (fixed, explainable)

| Trigger | Action | Who sees |
|---|---|---|
| Self-harm answer | Crisis screen now + clinician alert (always accepted, see §2) | Person + clinician |
| PHQ-9 ≥ 10 **and** ≥ 5 above own baseline, on 2 checks 1–2 weeks apart | "Call" list | Clinician |
| Any PHQ-9 ≥ 15 | "Call" list immediately | Clinician |
| PHQ-9 +5 but < 10 | "Watch": extra PHQ-9 within a week + self-help action | Person; clinician sees tag |
| Signals outside own range 5 of 7 days *(tuning parameter)* | Reach out + extra PHQ-9. **No clinician alert.** | Person |
| Silence 2 / 4 / 7 days | Warmer message → suggest friend → helpline / "lost contact" tag (care team only with onboarding consent) | Person → clinician |
| PHQ-9 < 5 on all checks ≥ 3 weeks | Label "remission" | Clinician |

Every alert carries a **one-line human-readable reason**. Priority weights are "transparent rules a clinician can tune", not validated.

## 8. Actions (pre-approved menu)

Walk outside / short exercise and **behavioural activation** (best evidence) · message the trusted friend · sea sounds / nature video · music · light *(clinician-configured only)* · short game *(partner later, e.g. Soihtu)* · **"no prompt"** (needed for honest learning). Evidence for brief actions *preventing relapse* is thin — we pitch the loop, not a cure.

## 9. Who does what (v3 — items numbered as in §W4)

- **Hugo:** #1 rename · #2 persona picker · #3 fire home background · #4 clinician view (with Uriel) · #6 reach-out banner · #8 silence ladder · #9 sea sounds · #10 paths screen · merge `hugo/mobile` to `main`
- **Uriel:** #5 "learned" card from the bandit · #7 PHQ-9 rules (§7) · baseline/drift tuning · EEG only if free
- **Owais:** #11 safety report never blocked by the 409 · merge `owais/backend` to `main` · README run instructions · privacy/consent story for the pitch · backup screen recording of the demo
- **Meg:** #2 the 5 persona files (with Claude, once Hugo confirms §12.3) · PHQ-9 wording fi/sv/en · copy for reach-out, silence ladder and "learned" card · pitch + name story · ask the mentors the W7.6 question · `DECISIONS.md`

## 10. Open decisions (full list with owners in `DECISIONS.md`)

- [ ] **Hugo confirms the `core.json` schema** in §12.3 (blocks the persona files)
- [x] 5 personas; the fifth is **False alarm** (Meg, 14 Nov)
- [ ] **v3 build order and cut list** (W4, W5) — team agrees or changes
- [ ] **Demo runs from local files; backend live call only as a bonus** (O10)
- [ ] **Merge both branches to `main` + README before the deadline** (O11)
- [ ] Owais: safety report accepted despite 409; cached crisis numbers + 112 in the app
- [ ] Fire floor: embers never go out
- [ ] Onboarding consent for contacting the care team after silence
- [ ] Check mieli.fi for the Swedish/English line hours before the demo
- [ ] How the backend's 7-day priority score and the PHQ-9 rule engine fit together (queue order vs "call" list)
- [ ] Pitch length, format and finalist round — check the Junction schedule

## 11. Sources

`docs/research/` — signals evidence, patient paths & Finnish care pathway, beyond-the-app (EHR/Kanta, players), actions evidence (written under the old name "Kajo" = Hiillos). Synthea licence: [Synthea DPG wiki](https://github.com/synthetichealth/synthea/wiki/DPG). Submission counts and judging criteria: Junction Discord announcement, 14 Nov 2026.

---

## 12. Repo check — `github.com/Hugo510/junction-2026` @ 0bfbd97 (Sat 09:35)

Expo app in `apps/mobile/` on branch **`hugo/mobile`** (~11k lines, strict TypeScript, domain tests, 4 locales). **Owais's FastAPI backend is on branch `owais/backend`** (last commit 08:40). `main` has only the initial commit. The commit predates Hugo's 09:41 answers, so some gaps below may already be in progress.

### 12.1 Already done — matches the spec (keep)

| Spec item | Where in the repo |
|---|---|
| Self-harm rule, never in the normal queue | `domain/riskRules.ts` (safety answer **or crisis words in fi/sv/en/es typed anywhere** → urgent); `consultQueue.ts` refuses urgent cases by design |
| Personal baseline, two-sided sleep, readable reasons | `domain/priorityScore.ts` (baseline = days 15–60; short < 5 h and long ≥ 10 h sleep; reasons as i18n keys) |
| Sensors prompt, humans decide | Companion **suggests** a consultation, never creates one |
| **Learning loop — already built** (now feeds the P0 "learned" card) | `domain/interventionPicker.ts`: per-person epsilon-greedy bandit, reward = 👍/😐/👎 + 0.25 × next-day mood change |
| Crisis numbers + 112 built in (the "cached copy" guardrail) | `config/crisisResources.ts`: 112, 09 2525 0111 (fi, 24/7), 0112 (sv), 0116 (en). **Numbers verified 14 Nov against MIELI's published lines → the `TODO: verify` can be closed; sv/en hours still "check".** |
| Aggregates only, consent per sensor, export + delete | `services/sensors/`, privacy screen |
| Fireplace with embers and flames | `app/exercise/fireplace.tsx` (currently an exercise, not the home background) |
| Demo mode | Settings → long-press logo: good week, declining week, urgent check-in, advance 1 day |

### 12.2 Gaps against P0 (ranked by value for the pitch)

1. **Name still "Valo"** in `app.json` (name, slug `valo-beyond-the-clinic`, scheme `valo`), `appName` in the locale files and the app README → change to **Hiillos** (decided 09:41).
2. **No clinician view.** The brief asks for "a simple way for professionals to see who might need a call". Quickest: one demo-mode screen listing the 5 personas sorted by the existing `priorityScore`, with level, top 2 reasons, last PHQ-9, urgent badge.
3. **No PHQ-9.** Check-ins use mood 1–5, energy, anxiety, sleep hours and one safety question. Add PHQ-9 **when the priority reaches medium** (not daily); item 9 reuses the existing safety rule. Meg supplies the official fi/sv wording.
4. **No "Where are you right now?" step.** Onboarding is language → welcome → consent → companion → baseline. Add the 4-path step and store `path` on `Patient`.
5. **No silence ladder 2/4/7.** Today missed check-ins only add points (`missedCheckIns`). Needs the warmer message → friend → helpline / "lost contact" sequence, and a trusted-friend contact (`reachOut` exists only as an action).
6. **Reach-out first:** chat opens with a greeting/suggestion when the app is opened; the simulated banner on *Advance 1 day* (decision 2) is not there yet.
7. **Fireplace as home background** growing with self-care (decision 4) — not yet; the exercise animation can be reused.
8. **Sea sounds / nature video** (decision 5) — not yet; current exercises are breathing, fireplace, fish, puzzle, move, walk.
9. **Personas:** the seed has 2 scenarios ("good", "declining"), 14 days, generated in the app (`data/seed.ts`); no persona picker or `core.json` loading yet.
10. **No "learned" card:** the bandit's per-person results are not shown anywhere on screen.
11. **Small:** root README still says "Team: TBD" and "Setup: TBD"; `docs/decisions.md` is empty (log challenge, stack, name, scope); label the reaction-time game "exploratory" in its reason text; keep `MockCompanionService` — no LLM (Gemini stub) for this demo.

### 12.3 Draft `core.json` schema (from `domain/entities.ts` + `data/seed.ts`) — Hugo to confirm

The app's in-app seed already produces `{ checkIns: CheckIn[], sensors: SensorAggregate[], feedback: InterventionFeedback[] }`. Proposed `core.json` = that, plus a header and the signals the spec needs:

```json
{
  "synthetic": true, "generatorVersion": "0.1", "seed": 2026,
  "persona": { "id": "aino", "path": "B", "state": "B5", "label": "Aino, 42, post-TMS" },
  "checkIns":  [ { "id": "...", "date": "2026-08-17", "createdAt": "...", "kind": "full",
                   "mood": 4, "emotions": ["calm"], "energy": 3, "anxiety": 2,
                   "sleepHours": 7.4, "safetyConcern": false } ],
  "sensors":   [ { "date": "2026-08-17", "activityMinutes": 42, "daylightMinutes": 65,
                   "homeMinutes": 820, "bedtime": "23:10", "steps": 6400, "nightPhoneMinutes": 12 } ],
  "feedback":  [ { "id": "...", "interventionId": "daylightWalk", "date": "2026-08-17", "rating": 1 } ],
  "phq9":      [ { "date": "2026-08-17", "items": [0,1,0,1,0,0,1,0,0], "total": 3 } ]
}
```

**New fields** (`homeMinutes`, `bedtime`, `steps`, `nightPhoneMinutes` on `SensorAggregate`; the `phq9` array; `persona.path/state`) need small type changes in `entities.ts`. Existing fields keep their current names and scales (mood 1–5, rating −1/0/1, `InterventionId` values `breathing | fireplace | fish | puzzle | move | daylightWalk | reachOut | gratitude`).

## 13. Architecture principles (build small, don't block the future)

If this works, Hiillos must be:
- **Extendable:** signal sources and actions as plug-ins — synthetic data today; Health Connect / HealthKit / Polar later; new actions (e.g. Soihtu, home stimulation) without touching the core.
- **Integrable:** the OpenAPI contract stays the single source of truth; PHQ-9 shaped as FHIR `QuestionnaireResponse` / `Observation` so it can flow into a county's patient record later.
- **Embeddable:** clinician view and companion as separate pieces — a clinic can embed the view in its own system, a partner can embed the companion in their app.
- **Scalable:** stateless API on Modal, PostgreSQL on Aiven (EU), compute on the phone, send only scores.

Nothing extra this weekend — just keep these doors open in how we name and split things.
