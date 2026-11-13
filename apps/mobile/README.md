# Valo — patient app (Beyond the Clinic, Junction 2026)

Mobile app for people who **successfully finished TMS treatment for depression**, to help them
stay well at home and prevent relapse. Built with Expo (SDK 58) + Expo Router, TypeScript strict.

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

## Structure

```
app/                      Expo Router routes
  (onboarding)/           start (language) → welcome → consent → companion → baseline
  (tabs)/                 today, checkin, comfort, insights, care
  exercise/               breathing, fireplace, fish, puzzle, move, walk
  settings/, privacy/     settings and privacy center
  crisis.tsx              crisis screen (reachable from every screen via "Need help now?")
  consult.tsx             consultation request (modal)
  demo.tsx                hidden demo mode
src/
  domain/                 pure TS (no React/RN): entities, priorityScore, riskRules,
                          consultQueue, interventionPicker, daylight, reaction + __tests__
  data/                   repositories.ts (interfaces), mock/ (AsyncStorage), api/ (stub), seed.ts
  services/               companion/ (CompanionService, Mock, Gemini stub), sensors/, haptics
  store/                  zustand: settings (persisted), data (cache over repositories), clock
  features/               screen building blocks (check-in flow, reaction game, feedback…)
  i18n/                   i18next config + locales/en|fi|es|sv.json
  ui/                     design system: tokens, AppText, Button, Card, Chip, Slider, Screen,
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

1. *Seed good week* → Today and Insights look calm; priority is low.
2. *Seed declining week* → mood, sleep, activity and reaction time get worse. The demo screen shows the
   priority jump (≈ 80/100, high); Today shows the companion **suggesting** a consultation.
3. Care → *Request a consultation* → high priority, readable reasons, 1st in line; the queue moves over time.
4. *Advance 1 day* → missed check-ins push the score further.
5. *Trigger urgent check-in* → crisis screen opens immediately and an urgent alert is created
   (never enters the normal queue).

## Languages

English (default), Suomi, Español, Svenska. Device language is detected on first launch
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
