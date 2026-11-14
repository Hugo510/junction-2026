# Hiillos — patient app (Beyond the Clinic, Junction 2026)

Mobile app for people who **successfully finished TMS treatment for depression**, to help them
stay well at home and prevent relapse. Built with Expo (SDK 58) + Expo Router, TypeScript strict.

> *Hiillos* = embers in Finnish: the inner fire we help people keep glowing.
>
> **Not a medical device.** The app does not diagnose or treat and always refers to professionals.
> All data is **synthetic**. In an emergency: 112.

## Run it (Expo Go, Android & iOS)

Requirements: Node 20+ and the **Expo Go** app (latest version from the store, it must support SDK 58).

```bash
cd apps/mobile
npm install
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS). Same Wi-Fi network as your computer;
if that fails, use `npx expo start --tunnel`.

Quality checks (all must pass):

```bash
npx tsc --noEmit        # types (strict)
npm test                # domain tests (jest-expo)
npm run i18n:check      # every locale has exactly the keys of en.json
npx expo-doctor         # Expo dependency/config health
```

## Chat-first experience

The home screen is a **conversation with the companion** the patient chose (ChatGPT-like: plain
companion messages, soft user bubbles, suggestion chips, a composer with a **+** quick-actions sheet, ☰ side menu).
Everything else opens *from* the chat as cards or from the menu:

- **Daily moment, not a form**: Hiillos speaks first → one mood tap → one small step. A low day (mood ≤ 2)
  adds the safety question. The longer check-in (sleep, energy, tap game) is weekly, by invitation.
- **Reach-out on drift**: when the priority reaches medium, Hiillos asks two quick questions (PHQ-2) and
  continues to the full PHQ-9 only if PHQ-2 ≥ 3. Sensors only ask, the questionnaire decides: the care team is
  suggested only after a recent PHQ-9 ≥ 10, and item 9 > 0 always takes the safety path (`src/domain/phq.ts`).
- **Guided check-in on request** ("Check in with me"): mood faces → feelings → optional note → safety question →
  saved to the journal (same `CheckIn` model the priority score uses).
- Free text is routed by small, transparent intents (en/fi/es/sv) to calming exercises, today's plan,
  trends, the care team or the journal. It is a **simulated companion**, not an LLM:
  `src/domain/chat/engine.ts` is pure and unit-tested; `GeminiCompanionService` is the future hook.
- **Crisis language** typed anywhere (chat or journal note) or a "yes" to the safety question →
  crisis screen + urgent alert, always.
- When the trend looks worrying, the companion **suggests** a consultation; it never creates one.

**Journal** (Duolingo/Mindspace-inspired, but kind): "days noticed" only grows (no streak that resets),
small milestones (1, 3, 7, 14, 30 days), a monthly mood calendar, most frequent feelings (14 days)
and every entry (from check-ins, chat or the journal itself).

## Look and feel

Hiillos has its own "embers" identity (`src/ui/tokens.ts`): warm cream surfaces, a glowing ember as the brand
colour, the rounded Nunito typeface (SIL Open Font License) and one soft colour per area of the app. Places and
exercises are **hub cards** (`FeatureCard`): text on the left, a simple original illustration on the right
(`Illustration`, drawn in SVG). The layout idea is inspired by calm wellbeing apps; colours, shapes and drawings are ours.
Every text/background pair is checked against WCAG AA in light and dark mode (`src/ui/__tests__/contrast.test.ts`).

## Structure

```
app/                      Expo Router routes
  chat.tsx                home: conversation with the companion + side menu
  (onboarding)/           start (language) → welcome → consent → companion → baseline
  progress.tsx            Journal | Trends (segmented)
  checkin, comfort, care  secondary screens (opened from chat cards, + sheet or ☰ menu)
  journal/new.tsx         quick journal entry
  exercise/               breathing, fireplace, fish, puzzle, move, walk
  settings/, privacy/     settings and privacy center
  crisis.tsx              crisis screen (reachable from every screen via "Need help now?")
  consult.tsx             consultation request (modal)
  demo.tsx                hidden demo mode
src/
  domain/                 pure TS (no React/RN): entities, priorityScore, riskRules,
                          consultQueue, interventionPicker, journal, chat/ (engine, intents),
                          daylight, reaction + __tests__
  data/                   repositories.ts (interfaces), mock/ (AsyncStorage), api/ (stub), seed.ts
  services/               companion/ (CompanionService, Mock, Gemini stub), sensors/, haptics
  store/                  zustand: settings (persisted), data (cache over repositories), clock
  features/               feature modules: view-model hooks (useChatViewModel, useJournalViewModel,
                          useInsightsViewModel) + presentational components; screens only render
  i18n/                   i18next config + locales/en|fi|es|sv.json
  ui/                     design system: tokens (color, 8-pt spacing, type, elevation, motion),
                          AppText, Button, Card, Section/ListItem, Chip, Slider, Screen, AppSkeleton,
                          Avatar, MoodFace, Sparkline/BarChart, Icon, empty/loading/error states
  config/crisisResources.ts
scripts/i18n-check.js
```

**Switching mock → real backend** is one line in `src/data/index.ts`
(`createMockRepositories()` → `createApiRepositories()`). The UI only talks to repository interfaces.

## Demo mode (for the pitch)

Settings → **long-press the app logo for 2 seconds**.

Buttons: *Seed good week*, *Seed declining week*, *Trigger urgent check-in*, *Advance 1 day*, *Reset app*.

Suggested 2-minute script:

1. *Seed good week* → back to the chat: a calm greeting; tap *Check in with me* and answer in the chat.
2. *Seed declining week* → mood, sleep, activity and reaction time get worse; priority jumps (≈ 85/100).
   The chat now opens with the companion **suggesting** a consultation.
3. Tap *Request a consultation* in the chat card → high priority, readable reasons, 1st in line.
4. Open ☰ → Progress → Journal: calendar of moods, feelings and the entry just saved from the chat.
5. Type a crisis phrase in the chat (or *Trigger urgent check-in*) → crisis screen opens immediately
   and an urgent alert is created (never enters the normal queue).

## Sensing and quiet rules

- **Priority score** (`src/domain/priorityScore.ts`): mood, two-sided sleep, activity, reaction time and, when the phone
  provides them, **time at home** and **last screen-off of the evening**. Every signal is compared with the person's own
  baseline (days 15–60), never with other people. `signalDrift()` returns the deltas for the clinician view.
- **Silence ladder** (`src/domain/outreach.ts`): 2 / 4 / 7 days, then one gentle message a week, **quiet after 30 days**.
  The clinic-only status **care ended** stops all outreach. Silence is never treated as relapse or death.
- **Discreet notifications** (default on): previews only say "A message from Hiillos".
- **Body map** in the weekly check-in ("Where is your fire today?"): 12 regions painted warm or cool by tap or drag,
  compared with the person's own usual map. Self-report only (method: Nummenmaa et al., PNAS 2014).
- **Onboarding** asks "Where are you right now?": four care paths, only "just finished treatment" is live.

## Demo personas (synthetic)

One file per persona in `assets/personas/<id>/core.json` (schema: `assets/personas/core.schema.json`,
example: `assets/personas/example/core.json`). Files must contain `"synthetic": true`. The five team personas (Aino, Leena, Juho, Sara, Elias; 90 days each) are generated in `tools/synthetic/` and copied in with
`npm run personas:sync` (reads `tools/synthetic/personas/<id>/core.json`, refuses files without `"synthetic": true` and never copies `ground_truth/`). Each file is registered in
`src/data/personas/index.ts` and appears in demo mode. Files keep real calendar dates: on load the app
moves every date so the last day becomes "yesterday". The app never reads `ground_truth/`.

## Languages

English (default), Suomi, Svenska, Español. Device language is detected on first launch
(fallback English), can be changed on the first onboarding screen and anytime in Settings
(no restart, persisted). Dates use date-fns locales; plurals use i18next. Companion messages follow
the active language. Finnish and Swedish texts should be reviewed by native speakers before the demo.

## What is simulated and what becomes real later

| Area | Now | Later |
| --- | --- | --- |
| Patient, history, care team | Synthetic, deterministic seed (14 days) in AsyncStorage | FastAPI on Modal + PostgreSQL on Aiven |
| Consultation queue | Simulated (fictional patients, advances every 40 min) | Real queue in the doctor panel |
| Urgent alerts | Stored locally, labelled "simulated" | Pushed to the care team |
| Companion | Template-based `MockCompanionService` | `GeminiCompanionService` calling **our backend** (API key never in the app) |
| Sensors | Live, only during exercises; only aggregates saved | Same, synced as aggregates |

## Privacy by design

- Consent per sensor (movement, tap pattern, approximate location, vibration); everything optional.
- Reaction game: only mean, variability and accuracy are stored, never individual taps.
- Location: used in memory during a walk to estimate time outside; coordinates are never stored.
- Export my data (JSON via share sheet) and Delete all my data (back to onboarding).

## Known limitations

- Expo Go only: no background sensing, no push notifications, no step counter history.
  Activity minutes come from exercises/walks (plus seeded history).
- Fish scene tilt direction may need tuning per platform (accelerometer axes).
- Crisis phone numbers in `src/config/crisisResources.ts` must be **verified with mentors before the demo**.
- Web is not a target (Expo Go mobile only).
