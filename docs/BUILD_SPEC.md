# Hiillos — build spec for the Junction demo

*SISU Lab · Junction 2026 · challenge "Beyond the Clinic" (Aalto)*
*v4.4 — ~10:55: repo check 10:50 — Hugo shipped M2 (one-tap daily moment), M3 (drift reach-out with PHQ-2 → PHQ-9) and the schema fields (S1); persona picker built; personas regenerated in his new format (v0.3). v4.3 — ~10:50: Uriel confirmed the clinician view (M4). v4.2 — ~10:45: W0 now lists **every** agreed idea and where it lives (nothing dropped): hologram C1 + ember lamp C5 (W12), care-ended status in S5 (W11), booster/EEG-check line in M4. v4.1 — ~10:40: EEG plan (clinic loop + C4 card on Meg's existing OpenNeuro ds003478 example), body map S6 (Aalto bodily maps). v4 — ~10:35: **new W0 "Win strategy on one page"** — three loops (person, clinic, many people), updated vision/mission/promises, now-vs-target per criterion, must/should/could adjustments with owners, non-code adjustments, timeline to Sun 10:00. v3.2 — ~10:30: repo check of all branches (§0), "learned" card found on the Insights screen, clinician-screen proposal for Owais (O21). v3.1 — Sat 14 Nov 2026, ~10:25: W3 status corrected against the app code (7-step check-in, sensing = activity + daylight only, no clinician screen, reach-out only on silence); new W8 four fixes, W9 sensing per person + across people, W10 clinical cleverness, W11 when a person dies, W12 optional wow; guardrails 8–9; personas v0.2 generated and checked. v3 — ~10:00: **new §W "How we win"** (vision, mission, the four criteria → four proofs, re-ranked build order, cut list, pitch skeleton). §0, §3, §4, §9, §10 updated to match. Backend found on branch `owais/backend`; `main` is still empty (see W6). v2.2 (~10:15) added the 5th persona and §13. v2.1 (~10:05) added the repo check §12. v1 was 07:40.*
*Read W0 first (2 min). The rest of §W is the reasoning; the rest of the file is the reference spec.*

---

## W. How we win

### W0. Win strategy on one page (v4 — Sat 10:35)

**The idea in one line (for judges):** *Hiillos is a companion that speaks first, learns what helps you, and calls the clinic only when it matters.*

**Our angle against 49 teams.** Most teams will build a tracker you have to feed. Hiillos is a **guide that gives back**, built as **three closed loops**, which is the brief's own language ("sense → respond → learn"):

| Loop | How often | What happens | Criteria it earns |
|---|---|---|---|
| **1. Person** | daily | Hiillos senses her day against *her own* normal → speaks first → one tap → one small step → learns what helps *her* | Ease · Smart sensing · Creativity |
| **2. Clinic** | when it matters | Drift → PHQ-2/PHQ-9 → clinician screen with a one-line reason → the clinic decides (e.g. a booster review). False alarms stop at step 2 | Usefulness |
| **3. Many people** | over time | With consent, aggregated scores only: a new person starts from what helped people like them; the clinic and the lab see what happens between discharge and relapse | Smart sensing · Usefulness (vision) |

Loops 1 and 2 are **demoed live**. Loop 3 is **shown once** (Juho's "learned" card starting from a population prior, if built) and **pitched as the vision**.

**Vision:** Nobody falls out of care just because they went home.

**Mission:** Hiillos is an active guide that keeps people inside a closed care loop after depression treatment, so they get more out of the treatment they had, stay connected to their life and their clinic, and stay well. The clinic tells Hiillos what to watch. Hiillos learns each person's own normal and what helps them, starting from what helped people like them, speaks first with one small step when the days drift, and brings in a human only when it matters.

**Three promises**
- **To the person:** You don't have to remember Hiillos. Hiillos remembers you. One tap, one small step, and the embers never go out.
- **To the clinic:** Only the calls that matter, each with a reason. You set what to watch; you make every decision.
- **To the lab (the "most promising idea" prize):** a first, person-by-person picture of what happens between discharge and relapse, and which home steps help whom. *Wording to check with a mentor.*

**Where we stand vs where we need to be** *(Claude's judgement from the code at 10:25; we have not seen other teams)*

| Criterion | Now | After the must-fixes | What closes the gap |
|---|---|---|---|
| Usefulness | Medium | Strong | Clinician screen with reasons; false-alarm persona; clinic sets the early signs |
| Ease of use | Medium-weak (7-step form) | Strong | Guiding daily moment: Hiillos speaks, one tap, one step; full check-in weekly |
| Smart sensing | Weak (activity + daylight only; reach-out on silence only) | Medium-strong | Reach out on drift; home time + screen-off; "learned" line on home; population prior |
| Creativity | Medium | Medium-strong | Fire as the one hero image; quiet when well; name story; optional hologram |

**Solution adjustments, ranked** (owners as of 10:30; Owais is resting)

| # | Must (by ~15:00) | Owner | ~h |
|---|---|---|---|
| M1 | ~~Persona picker~~ **built 10:12** · remaining: copy `tools/synthetic/personas/*` to `apps/mobile/assets/personas/` and add the 5 `require` lines (see `tools/synthetic/ABOUT.md`) | Hugo | 0.2 |
| M2 | ✅ **Built by Hugo 10:39** — **Guiding daily moment:** Hiillos speaks first → 5-ember mood tap → one small step from the bandit. 7-step check-in becomes weekly / on "medium" | Hugo | 2 |
| M3 | ✅ **Built by Hugo 10:39** (PHQ-2 at medium, PHQ-2 ≥ 3 → full PHQ-9, item 9 → safety rule, care team suggested only after PHQ-9 ≥ 10) — **Reach out on drift** when the score hits medium → PHQ-2 → PHQ-9 if needed; never a clinic alert from sensors alone | Uriel | 1–1.5 |
| M4 | **Clinician screen** *(Uriel confirmed 10:36; reuses `priorityScore` + persona data)*: 5 personas, level, top 2 reasons in plain words, last PHQ-9, lost-contact tag; for the "call" list a "consider a review (e.g. booster, EEG check)" line — the decision stays with the clinic | Uriel | 2–3 |

| # | Should (by ~19:00) | Owner | ~h |
|---|---|---|---|
| S1 | ✅ **Schema + types done by Hugo (10:12/10:38); personas v0.3 carry the data** — Schema + types for `homeMinutes`, `screenOffTime`, `phq9` → switch to `personas_extended/` (Aino's reason becomes "home time +40 %, bedtime +1h40 vs her normal") | Hugo | 1 |
| S2 | "What helps you" top line under the fire on home | Hugo | 0.5 |
| S3 | **Clinic sets the early signs:** 2–3 checkboxes on the clinician screen / onboarding (sleeps later, stays home, irritable…); drift reasons name *those* | Uriel | 1 |
| S4 | **Population prior** in the bandit (`PRIOR_MEAN` per action from the other personas) → loop 3 visible | Uriel | 1 |
| S5 | **When a person dies / care ends (W11):** calm lock-screen text ("A message from Hiillos"); silence ladder quiet after 30 days; clinic-only "care ended" status on the clinician screen stops all outreach | Hugo · Uriel | 1 |
| S6 | **Body map "Where is your fire today?"** — paint warm / cold on a body silhouette with one finger; replaces the "emotions" step in the weekly check-in; today's map vs her own usual map. Method from Aalto: *Bodily maps of emotions*, Nummenmaa, Glerean, Hari, Hietanen, PNAS 2014, doi 10.1073/pnas.1321664111 (701 participants coloured where they felt activity increase or decrease). Self-report, **never** a diagnosis. Claude can add body maps to the 5 personas | Hugo (UI) · Claude (data) | 2–3 |

| # | Could (only if ahead) | Owner |
|---|---|---|
| C1 | **Prism hologram of the fire (W12)** — clear plastic pyramid on a phone/tablet; booth + pitch photo. 1–2 h cap | Meg |
| C5 | **Ember lamp (W12)** — Arduino + LED glowing with self-care; light or motion sensor = a real sensor in the home (brief's "smart home" direction). Only if someone has the hardware; 1–2 h cap; the demo never depends on it | whoever has the hardware |
| C2 | Owais's web clinician page (embeddable) | Owais |
| C3 | Sea sounds as an action (CC0) | Hugo |
| C4 | **EEG card in the clinician screen ("research layer, not an alarm")**, built on Meg's existing `healthdeeptech-starter/examples/eeg_rest_openneuro.py` (OpenNeuro ds003478 "EEG: Depression rest", Cavanagh, CC0, doi 10.18112/openneuro.ds003478.v1.1.0): band power delta/theta/alpha/beta per channel, eyes closed. Meg exports 2–3 subjects to CSV on her laptop; the screen shows one as "example EEG at discharge — open research recording, not this person". Shown honestly: students aged 18–24, not post-TMS, one visit each, no relapse labels, **no validated EEG biomarker for depression** | Meg (data) · Uriel (card) |

**Not this weekend:** PostgreSQL, FHIR, Path C, live EEG from a headset, LLM chat, real push, camera pulse. (Hologram and ember lamp are **not** dropped: they are C1 and C5.)

**Nothing agreed is dropped — where each idea lives** *(check this list before cutting anything)*

| Idea (agreed) | Section | Lives in |
|---|---|---|
| Guiding app, not a clicker | W8.1 | M2 |
| Reach out on drift | W8.2 | M3 |
| "What Hiillos has learned" | W8.3 | S2 |
| Clinician screen | W8.4 | M4 |
| Time at home, screen-off (bedtime) **and its regularity**, PHQ-9 | W9, W10 | S1 (data ready) |
| Learning across people (population prior) | W9 | S4 |
| Value in the aggregate, for the clinic and the lab | W9 | pitch, loop 3, promise to the lab |
| Clinic tells Hiillos what to watch (early signs) | W10 | S3 |
| PHQ-2 as the light step, PHQ-9 on a schedule | W10 | M3 |
| Behavioural activation as the action engine | W10, §8 | action menu (exists) |
| Season-aware comparison (Finnish November) | W10 | pitch now; code later (compare to own recent weeks — already how the baseline works) |
| Booster / EEG-check review for the clinic | W10 | M4 |
| When a person dies / care ends | W11 | S5 + safety slide |
| Body map "Where is your fire today?" | S6 | S6 |
| EEG via the clinic loop + open-data card | O25 | pitch + C4 |
| Prism hologram of the fire | W12 | C1 |
| Ember lamp (Arduino) | W12 | C5 |
| Mentor check, three-loop pitch, language switch, submission text, deck, sleep plan | W0 | "Other adjustments" below |

**EEG, our way (decided 10:35):** a phone cannot record EEG, and the judges are the TMS–EEG experts, so we do not fake it. EEG enters **loop 2, the clinic**: the clinic's own EEG / TMS–EEG from treatment is part of her starting point, and when Hiillos sees drift at home the clinician screen can say "consider an EEG check or booster review". In the app, EEG appears only as the C4 research card from open data. Ask the mentors whether the booth's portable EEG could give us one real minute for the demo.

**Other adjustments (not code)**
1. **Book a mentor check today** (Ilmoniemi/Lioumis group): PHQ-2/PHQ-9 cadence and the safety question, "consider a booster review" wording, the lab ask. It improves the content *and* starts the relationship the "most promising idea" prize depends on.
2. **Pitch built on the three loops:** name story → Aino live (loop 1 → loop 2) → Elias, the false alarm → Juho, the opposite learning → loop 3 vision → safety and ethics in one slide (not a medical device yet, synthetic data, never infers death, consent) → closing slide with the four criteria and our proofs.
3. **Demo in English, with a two-second switch to Finnish or Swedish** to show it is built for people here.
4. **Submission text** rewritten from W0 on Saturday evening (Friday's says "Hiilos", face tracking, bee/cat).
5. **Deck** outside Lovable to save credits (Claude can build it as Slides).
6. **Team energy:** Owais slept after the night; Hugo and Uriel need a sleep window tonight; Meg sleeps before the pitch. The pitcher's clarity is worth more than one more feature.

**Timeline to Sun 10:00** *(pitch time and format still to confirm on the Junction schedule)*
- **10:30–15:00** Must M1–M4 · Meg: mentor booking, PHQ-2/9 wording fi/sv/en, copy for the daily moment.
- **15:00–19:00** Should S1–S5 · Meg: pitch script + deck draft.
- **19:00–21:00** Merge to `main`, README, two full demo run-throughs on a phone.
- **21:00 feature freeze.** After that only bug fixes.
- **Evening** Meg: submission text; hologram if wanted. Owais (rested): push his code, backup demo recording.
- **Sun 07:30–09:30** Rehearse with a stopwatch ×3, final recording, **submit by 09:30** (30 min buffer).

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
| **Usefulness** | Could it really help people stay well at home? | Aino's drift is caught **2 weeks before** her PHQ-9 crosses 10 → one small action → the clinic gets her on the "call" list with a one-line reason, early enough for the clinic to consider a booster. Plus Elias: **no** false alert to the clinic. | **Clinician view missing** (`consult.tsx` is the patient asking for a consultation) · PHQ-9 missing in the app (data ready, W9) |
| **Ease of use** | Would someone recovering from depression actually use it every day? | **A guiding app, not a clicker.** Hiillos speaks first, asks one thing, offers one small step. The full check-in is weekly or when something changes. Bad days are met with kindness: the fire never dies, silence gets a warmer message, not a warning. | **Today the daily check-in is 7 steps** (mood, emotions, energy, sleep, reaction game, safety, note) → redesign W8.1 · silence ladder + simulated reach-out **built 10:01** |
| **Smart sensing** | Clever use of home measurements, and learns what works for each person? | **Her own baseline, both directions**; time at home and screen-off time vs her own normal; the clinic tells Hiillos *her* early signs. A **"What Hiillos has learned"** card: walks for Aino, sound for Juho. And it learns **across people**: a new person starts from what helped people like them (W9). | App senses only **activity + daylight**; sleep/mood/energy/anxiety are self-reported · reach-out only on **silence, not drift** · "What seems to help you" **exists** on the Progress → Insights screen, not yet on the home screen |
| **Creativity** | How original and delightful? | **The fire is the home screen**: it grows with self-care, never with the risk score, and the embers never go out. Hiillos is **quiet when you're well** (Leena). The name story. Optional: the fire as a hologram or a real ember lamp (W12). | Renamed to Hiillos + embers on chat home **built 10:01** (not yet seen running) · companion animals still compete with the fire (O14) |

*Status column checked against `hugo/mobile` @ 7796c1e (10:01) at 10:15.*

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

### W8. The four fixes that move the score (agreed by Meg 10:16)

1. **Guiding daily moment instead of a form** (Ease). Hiillos opens with one line in its own voice ("Morning, Aino. How's the fire today?") and **one tap** of five embers for mood. Then it offers **one** small step from what has helped *her* (the bandit). Done in under 10 seconds. The 7-step check-in becomes the **weekly** check-in, also triggered when the score reaches "medium". The reaction game stays optional.
   - **Safety question — Meg to decide:** proposal is to ask it whenever the mood tap is 1–2, inside every PHQ-9 (item 9), and in the weekly check-in. Not daily on good days. Trade-off: daily is safest, but daily on good days is what turns a companion into a clicker.
2. **Reach out on drift, not only on silence** (Smart sensing · Ease). When `priorityScore` reaches **medium**, the simulated notification says "Noticed the week's been heavier. Two quick questions?" → PHQ-2 → PHQ-9 if needed. No clinician alert from this step (guardrail 3). *Hugo or Uriel, ~1 h.*
3. **"What Hiillos has learned" card** (Smart sensing). *Already built as "What seems to help you" in `features/insights/InsightsView.tsx` (Progress tab).* Remaining work: show its top line on the home screen under the fire, and open Progress in the demo. *~30 min.*
4. **Clinician screen** (Usefulness). Agreed as a must on Fri. One demo screen listing the 5 personas: level, score, top 2 reasons in plain words, last PHQ-9 + trend, "lost contact" tag, urgent badge. Read-only. *Decided 10:21: **Uriel builds it in the app** (Owais is resting). Owais's web version is an extra only if time allows: a small web page served by the FastAPI backend with the `doctor` demo token, reading the same 5 persona files — a separate, embeddable piece (§13). Expected scores per persona from the app's own code are in `tools/synthetic/ABOUT.md` as test fixtures, so Python and TypeScript must agree. Fallback: an in-app demo screen (Uriel).*

### W9. Smart sensing: one person *and* many people

**What a phone can sense with no wearable** (add now, data ready in `personas_extended/`): time at home (geofence, no coordinates kept), last screen-off of the evening (bedtime proxy) and its **regularity**, activity, daylight. Plus PHQ-9 every 2 weeks and when Hiillos reaches out. Wearables (HRV, sleep) plug in later through Health Connect / HealthKit.

**The value is in the aggregate: per person and across people** (Meg). With the person's consent, and only aggregated scores (never raw data):
- **Per person:** her own baseline and her own "what helps" ranking (built).
- **Across people:** a new person does not start from zero. The learning starts from *what helped people like them*, then their own answers take over after a few tries. Small code change: the bandit's `PRIOR_MEAN` becomes a per-action prior from the population. Card text: "Many people find walks help. For you, sound works better."
- **For the clinic:** the clinician view shows the whole group: who is drifting, how many came back after one small step, which steps work for this clinic's patients.
- **For the lab and the investment story:** after many people, an anonymised picture of what happens between discharge and relapse, and which home steps help whom. That dataset is the long-term asset. *Pitch it as the vision, not as something built this weekend.*

### W10. Borrow more from the clinic (clinical cleverness)

*These are ideas from known clinical practice; check the exact wording with the mentors before the pitch.*
- **The clinic tells Hiillos what to watch.** At discharge the clinic enters the person's own 2–3 early warning signs (Aino: sleeps later, stays home, irritable), the way relapse-prevention plans are written. Hiillos watches exactly those, not a generic list.
- **Measurement-based care:** PHQ-9 on a schedule, plus PHQ-2 as the light two-question step when Hiillos reaches out. Same instruments clinicians already use, so the clinician view speaks their language.
- **Rhythm, not just amount:** regular bedtime and wake time matter in depression care, not only how long someone sleeps. Screen-off regularity vs her own normal is a cheap, clinically meaningful signal.
- **Behavioural activation as the action engine:** the small steps are planned, valued activities, which has the best evidence of our action menu (§8).
- **Season-aware in Finland:** daylight in November is not compared to August. Compare against the person's own recent weeks and, later, against people in the same season.
- **Booster TMS:** the clinician view can show "consider a review" with the reason. The decision is always the clinic's; nothing about treatment is ever said to the patient (guardrail 2).

### W11. When a person dies (Meg 10:16)

A known failure in health apps: the app keeps sending cheerful nudges after someone has died, and the family sees them. Hiillos must never do that.
- **Never infer death from silence.** Silence is not relapse and not death. The app never guesses.
- **The ladder stops.** After "reconnect" (day 7), at most one gentle message a week, then **quiet after 30 days** (account dormant). No endless "we miss you".
- **Hiillos never messages the trusted person by itself.** It only *suggests* the person contacts them (already so in the app).
- **The clinic can close the loop:** a clinician-only status "care ended" (moved, transferred, deceased) stops all outreach at once and freezes the data for the clinic's own review and the family's requests. Never self-declared, never inferred.
- **Discreet notifications:** lock-screen text never mentions depression, mood or crisis ("A message from Hiillos"), because family or others may see the phone.
- **Data after death:** retention and family access follow the law and the clinic's rules. *Check how GDPR and Finnish law treat a deceased person's data before claiming anything in the pitch; not verified.*
- Not in the demo. One line on the safety slide, and ready for Q&A.

### W12. Optional "wow" (only after W8 is done; strict 1–2 h timebox)

- **Prism hologram of the fire:** a clear plastic pyramid on a phone or tablet shows the ember fire floating in 3D. Pure delight, no sensing. Cheap, Meg can own it; good for the booth and the pitch photo.
- **Ember lamp (Arduino + LED, if someone has the hardware):** a small physical ember at home that glows with self-care, so a person sees Hiillos without opening the phone. Can also sense: a light sensor (daylight in the room) or motion (up and about). It answers the brief's "smart home" direction. **The demo must not depend on it.**

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

**Repo check 10:50:** `hugo/mobile` @ dfd5786 (10:39): persona picker in demo mode, team persona format (`apps/mobile/assets/personas/<id>/core.json`, `"synthetic": true`, date rebasing), `screenOffTime` + PHQ-2/PHQ-9, one-tap daily check-in, drift reach-out with PHQ-2 → PHQ-9, texts in en/fi/es/sv. `main` @ d2940e7: spec, decisions, personas v0.3 (pushed 10:55). `owais/backend`: unchanged since 08:40.

**Repo check 10:25 (all branches):**
- `hugo/mobile` @ 7796c1e (10:01): rename to Hiillos complete (`app.json`, locales); embers ("Hearth") on the chat home; silence ladder + simulated reach-out in demo mode; trusted person + silence consent; "Advance 1 day" shifts the app's clock correctly. **Not yet:** persona picker (`PERSONA_FILES` is empty), drift-triggered reach-out, clinician screen, PHQ-9.
- `owais/backend` @ e136fa6 (**08:40, nothing since**): only `health`, `auth`, `patient` (`/me`, consents) routes. **`POST /checkins`, the self-harm rule and the priority score from the 08:52 status are not on GitHub** — local only, or not done. Also a stray `test.txt`.
- Root README still says "Team: TBD" / "Setup: TBD". It already lists the four GitHub accounts (Hugo510, muhammad-owais-javed, margita68, urielcont).

**Personas: done (v0.2, 10:20).** 5 × 90 days in Hugo's `core.schema.json` format (`hugo/mobile` @ 33c2dc7), checked with the app's own `priorityScore`, `outreach`, `embers` and `interventionPicker`. Extended files add `homeMinutes`, `screenOffTime` and `phq9` once the schema has those fields. See `tools/synthetic/ABOUT.md`. §12.3 below is superseded by Hugo's schema.

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
8. **Never infer death; stop outreach when care ends** (W11). The ladder goes quiet after 30 days; only the clinic can set "care ended"; lock-screen text never names mood or depression.
9. **Cross-person learning only with consent and only on aggregated scores** (W9).

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

- [x] Persona format: Hugo's `core.schema.json` (10:01); personas v0.2 generated
- [ ] Hugo: add `homeMinutes`, `screenOffTime`, `phq9` to schema + `entities.ts` (W9)
- [ ] Safety question cadence in the new daily moment (W8.1) → **Meg**
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
