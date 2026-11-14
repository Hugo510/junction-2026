# Hiillos — decisions log

*SISU Lab · Junction 2026 · "Beyond the Clinic" (Aalto). One line per decision, newest section first.*
*Rule: if it's not in this file, it isn't decided. Proposals stay under "Open" until someone says yes.*

---

## Open (needs a decision or an answer)

| # | Question | Proposed by | Waiting on |
|---|---|---|---|
| O1 | **One check-in per day (409) must not block a safety report.** If someone checks in fine in the morning and has self-harm thoughts in the evening, the server must still accept it. Options: `selfHarmThoughts = true` always goes through, or a separate safety endpoint. | Meg | Owais |
| O2 | **Crisis number: API-only vs cached in the app.** Owais: show it only from the API, remove the hardcoded number. Meg: API stays the source of truth, but the app keeps a cached copy with 112 built in, in case the network or server is down at that moment. *Note: the app already has `config/crisisResources.ts` with 112 + MIELI lines (repo check 10:05) — so the question is only whether the API overrides it when reachable.* | Meg / Owais | Owais + Hugo |
| O3 | **Embers never go out.** Fire follows self-care (decided), but needs a floor so it can glow low and never die, and it changes slowly. | Meg | Hugo |
| O4 | **Silence ladder wording + consent.** Day 7 reads as "we lost touch, here's how to reach us", not crisis language. Contacting the care team after silence needs consent given at onboarding (checkbox on the consent screen). | Meg | Hugo |
| O9 | App repo `Hugo510/junction-2026` still says **"Valo"** (`app.json`, locales, README) → rename to Hiillos. *Backend found 10:30: same repo, branch `owais/backend`; app on `hugo/mobile`; `main` is empty (see O11).* | Repo check 10:05 | Hugo |
| O6 | **Two scoring systems to reconcile.** Backend has a 7-day priority score with reasons. Build spec has a PHQ-9 rule engine (thresholds below). Decide: does the priority score order the clinician queue, and the PHQ-9 rules decide who lands on the "call" list? | Meg | Owais + Uriel |
| O7 | Confirm the crisis line on mieli.fi before the demo, then set `verified: true`. | Owais | Anyone, Sun morning |
| O8 | Demo clock / time zone: check-in dates are local, `datetime.now` is UTC. Fix with the demo clock; don't demo between 00:00–02:00 Helsinki. | Owais | Owais |
| O10 | **Demo runs from local persona files**, with crisis numbers built in; a live backend call is a bonus only if the Wi-Fi holds; screen recording of the full demo as backup. | Meg (BUILD_SPEC v3 W6) | Team |
| O11 | **Merge `hugo/mobile` and `owais/backend` into `main` + README** (pitch line, how to run, team, "all data synthetic") well before the **Sun 10:00** final submission. | Meg (v3 W6) | Hugo + Owais |
| O12 | **v3 build order and cut list** (BUILD_SPEC W4/W5): fire as home screen, clinician view and a "what Hiillos has learned" card become P0; PostgreSQL, FHIR layer 2, Path C and EEG move to the roadmap slide. | Meg (v3) | Team |
| O13 | **Take load off Hugo:** proposal is that Uriel builds the clinician view, the "learned" card and the PHQ-9 screens, and Owais does the merge, the README, the 409 fix and the backup recording. | Meg (v3) | Team |
| O14 | **Companion animals vs the fire:** two mascots dilute the one image judges should remember. Proposal: the fire is the home screen; the animal, if kept, is a small voice beside it, not a second hero. | Meg (v3) | Hugo |
| O16 | **Safety question cadence** in the new daily moment: proposal = when mood tap is 1–2, in every PHQ-9 (item 9) and in the weekly check-in; not daily on good days. | Claude (spec W8.1) | **Meg** |
| O18 | **Cross-person learning:** bandit starts from a population prior per action, then personal data takes over; consent + aggregated scores only. This weekend: pitch + maybe the prior in code. | Meg (W9) | Uriel |
| O19 | **When a person dies / care ends (W11):** ladder quiet after 30 days; clinic-only "care ended" status stops all outreach; neutral lock-screen text; legal check before any pitch claim. | Meg | Hugo (texts), Owais (data) |
| O22 | **Owais, when back from rest — in order:** (1) push the check-ins / self-harm / priority-score code (GitHub has only health, auth, `/me`, last push 08:40); (2) merge both branches to `main` + README; (3) backup demo recording. The demo does not depend on the backend (app runs on local data). | Repo check 10:25 · Meg 10:21 | Owais |
| O23 | **Win strategy v4 (spec W0):** three loops; must M1–M4 by ~15:00, should S1–S5 by ~19:00, **feature freeze 21:00**, submit by **Sun 09:30**. | Claude (spec W0) | Meg + team |
| O24 | **Mentor check today** (Ilmoniemi/Lioumis group): PHQ-2/9 cadence + safety question, "consider a booster review" wording, the lab ask. | Claude (spec W0) | Meg |
| O25 | **EEG:** in the clinic loop (pitch) + C4 research card on Meg's `eeg_rest_openneuro.py` (ds003478, CC0); no headset, no "EEG detects relapse" claims; ask mentors about one real minute from the booth EEG. | Meg 10:34 | Meg · Uriel |
| O26 | **Body map S6** ("Where is your fire today?"), Aalto bodily-maps method, self-report only; replaces the emotions step in the weekly check-in. | Claude (Meg agreed 10:35) | Hugo · Claude (persona data) |
| O27 | **Who meets the challenge partner (Aalto TMS group) today?** Proposal: Meg (domain, mentor check O24, the lab ask) + one builder (Uriel — clinician view questions); the others keep building. Times: check the Junction app/Discord. | Claude 10:55 | Meg |
| O28 | **PHQ-9 wording in fi / sv / es:** Hugo wrote the nine items himself in `apps/mobile/src/i18n/locales/*.json` (`phq.items`). Check against the officially validated translations before the demo (PHQ instruments are free to use; use the published wording, not our own). | Claude 10:55 | Meg (fi, sv) |
| O20 | **Optional wow (W12) — kept, not dropped (Meg 10:36):** prism hologram of the fire (C1, Meg) and Arduino ember lamp (C5) — after M1–M4, 1–2 h cap each, demo never depends on them. Who has hardware? | Meg | Team |

---

## Sat 14 Nov 2026

**Team logistics (Meg 10:53)**
- Meg is resting until 13:00 (sleep debt after the night). The team meets in person at Junction at 13:00 (lunch).

**Done (10:50 repo check)**
- **Hugo shipped** M2 one-tap daily moment, M3 drift reach-out (PHQ-2 → PHQ-9), persona picker, and the schema fields `homeMinutes`, `screenOffTime`, `phq9` (closes O17). M3 had been Uriel's; Uriel now has M4 only.
- **Personas v0.3** regenerated in Hugo's new format (`personas/<id>/core.json`, `"synthetic": true`) and checked with the app's own loader, date rebasing and PHQ rules. Sara's phone now keeps logging through her silent week, so rebasing keeps the silence ladder visible.

**Decided (10:40, Meg)**
- **Docs go straight to `main`:** changes to `docs/` (spec, decisions, personas) and `tools/synthetic/` are pushed directly to `main` the moment they are made, so the team always sees the latest. App code still goes through pull requests (CONTRIBUTING.md). PR #1 merged 10:39.

**Decided (10:36, Uriel)**
- **Uriel owns the clinician view** (confirmed 10:36): in-app demo screen with the 5 synthetic patients — priority level and score, top two reasons, latest PHQ-9, lost-contact status. Reuses the existing `priorityScore` logic and the persona data; **no separate implementation**. (Closes O21.)

**Decided (10:16, Meg)**
- **The four fixes (spec W8) are the priority:** (1) guiding daily moment — Hiillos speaks first, one tap, one small step; the 7-step check-in becomes weekly or on change; (2) reach out on drift when the score hits medium, not only on silence; (3) "What Hiillos has learned" card; (4) clinician screen (agreed already Fri).
- **Smart sensing story:** value is in the aggregate, per person **and across people**, with consent (W9). Pull more from clinical practice (W10).
- **Persona data:** Hugo's `core.schema.json` is the format. v0.2 generated (5 × 90 days) and checked against the app's own rules: Aino high (70) on demo day, Elias medium in his flu week only, Juho's learning is the opposite of Aino's, Sara reaches "reconnect".

**Facts (10:25 repo check)**
- App: rename, embers on home, silence ladder, reach-out demo, trusted person done (10:01). "What seems to help you" already exists on the Insights screen. Still missing: persona picker, drift reach-out, clinician screen, PHQ-9.
- Backend on GitHub: health, auth, `/me` only; last push 08:40.

**Facts (10:30)**
- Preliminary submissions: Beyond the Clinic has **49 projects**, one of the most crowded challenges. Judging is 4 × 25%: usefulness, ease of use, smart sensing, creativity. Strategy in BUILD_SPEC v3 §W (proposals O10–O15 above).
- **Final submission due Sun 10:00.** Friday's preliminary text ("Hiilos", face/eye tracking, bee/cat companions) must be rewritten from BUILD_SPEC W2/W3.

**Product**
- Name is **Hiillos** (two l's). Hugo renames the app. Pitch and challenge text must change from "Hiilos".
- **5 demo personas × 90 days**, delivered as `core.json` per persona; the app gets a persona picker in demo mode. `ground_truth/` is not read by the app. (Hugo OK; 5th persona added by Meg.)
- **5th persona = "False alarm"**: signals leave her own range for a week (flu, travel or a deadline), Hiillos reaches out, PHQ-9 stays low, kind reply, **no clinician alert**. Shows "sensors only ask, questionnaires decide, humans confirm". (Meg)
- **Fireplace:** background of chat/home; flames grow with **self-care** (check-ins, small actions), **not** with the priority score, so a struggling person never sees their fire dying. Priority score is for clinicians only. (Hugo, Meg agrees)
- **Reaches out first:** simulated in-app notification in demo mode; the companion opens each day with a check-in invite and small suggestions. Real push = roadmap (limited in Expo Go). (Hugo)
- **Support ladder:** trusted friend stored **only on the phone**, one-tap call/message; 24-h helpline in the crisis screen; **112 only via the safety path**. (Hugo)
- **Silence rule:** 2 missed days → warmer message · 4 → suggest the friend · 7 → helpline / care team. (Hugo; wording + consent open, see O4)
- **Comfort actions:** sea sounds + nature video with CC0 files (expo-audio / expo-video). Keep a source list for each file (submission is MIT). 3D music meditation = roadmap. (Hugo)
- **Finger-on-camera pulse:** not in Expo Go → roadmap. (Hugo)
- **EEG:** shown only as an "experimental, not diagnostic" card, and only if Uriel/Owais have the endpoint ready by Sunday morning. (Hugo)
- **Crisis numbers:** MIELI Crisis Helpline **09 2525 0111** (Finnish, 24/7) + **112**. Swedish and English MIELI lines have limited hours → outside those hours fall back to the Finnish line + 112. (verified from secondary sources 14 Nov; confirm on mieli.fi, see O7)
- **Architecture principles** (Meg): if this works, Hiillos must be **extendable** (signal sources and actions as plug-ins), **integrable** (OpenAPI contract as single source of truth; PHQ-9 shaped as FHIR `QuestionnaireResponse` / `Observation`), **embeddable** (clinician view and companion as separate pieces), **scalable** (stateless API, EU database, compute on the phone, send only scores). Nothing extra this weekend — just keep the doors open in naming and structure.

**Backend (Owais, status 08:52)**
- Routes → service layer → repository layer.
- Done: `/health`, `/auth/demo-login`, `GET/PATCH /me`, `PUT /me/consents`, problem+json errors (401/403/404/422), `POST /checkins` with one check-in per day (409), self-harm rule (always `urgent`, care-team alert, crisis resources, never the normal queue), 7-day priority score with displayable reasons, `suggestConsultation` when mood clearly drops.
- Storage is in memory until PostgreSQL. Priority weights are guesses, to be tuned; every point must have a reason.

**Positioning**
- Hiillos is **not YET a medical device**: launch as a wellness companion; the MDR path (e.g. clinician view, relapse detection) is a later, deliberate step and part of the investment story. (Meg)

## Fri 13 Nov 2026
- Challenge: **"Beyond the Clinic"** (Aalto) — staying well at home after depression treatment (TMS).
- Team **SISU Lab**: Meg (problem, health domain, pitch), Hugo (app), Uriel (full-stack/Python), Owais (backend, cloud, security).
- **Stack:** Expo (React Native + TypeScript) · FastAPI on Modal · PostgreSQL on Aiven (EU) · Gemini via Google AI Studio, called **only from the backend** (key in Modal Secrets) · optional CRACI for CI/SBOM. (Hugo proposal, in use)
- **API contract** (OpenAPI 3.1, `/api/v1`, camelCase, UUIDs, ISO 8601 UTC, `Accept-Language` en/fi/es/sv, problem+json) is the single source of truth for app and backend.
- **Only synthetic data.** Raw sensor signals never leave the phone, only aggregates; no precise coordinates stored. The API never returns diagnoses.
