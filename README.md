# Hiillos

**Staying well at home after TMS treatment for depression.**
Junction 2026 (Espoo, 13–15 November 2026) · challenge *Beyond the Clinic* · team **SISU Lab**

> *Hiillos* is Finnish for embers: the inner fire we help people keep glowing.

Hiillos is a companion that speaks first. It proposes one small step, looks at how the person's
body answers that night, and learns what helps *that* person. The clinic is the safety net: it
hears from Hiillos only when it matters, with a one-line reason, and it makes every decision.

> **Not a medical device.** Hiillos does not diagnose or give treatment, and it always points to
> professionals. **All data in this repository is synthetic.** In an emergency: 112.

## What is in this repository

| Folder | What it is |
| --- | --- |
| [`apps/mobile`](apps/mobile) | The app (Expo, React Native, TypeScript). Patient side and a clinician overview. Runs in Expo Go. |
| [`backend`](backend) | Optional API (FastAPI). The app works fully without it. |
| [`tools/synthetic`](tools/synthetic) | Generator for the five synthetic personas (90 days each, plus a smart-ring layer). |
| [`docs`](docs) | Build spec, decisions log, demo and pitch notes, and the research behind the rules. |

## How it works, in one minute

- **Body loop.** A watch or ring gives daily totals (sleep, steps, resting heart rate, night-time
  recovery). Hiillos proposes a small step, compares the following night with the person's own
  usual, and learns from the answer. Today the wearable is simulated and the ring data is synthetic.
- **Only compared with yourself.** Each person's "normal" is anchored to their last known well
  period, never a rolling window, with weekdays and weekends apart. A smoothed trend has to stay
  outside the person's own range on 3 of the last 5 days before it counts.
- **Sensors ask, questionnaires decide, people confirm.** A drift makes Hiillos ask two questions
  (PHQ-2), then nine (PHQ-9) only if needed. No clinic alert ever comes from sensors alone.
- **Safety is a fixed rule, never a model.** A "yes" to the safety question, or crisis language,
  opens the crisis screen at once.
- **Private by design.** The app is local-first. Notes, feelings and location never leave the
  phone. AI replies and the companion's voice are opt-in and off by default.

The thresholds are design choices drawn from the research notes in [`docs/research`](docs/research),
not validated cut-offs. Effect sizes in the synthetic data are illustrative.

## Run the app

Requirements: Node 20 or newer, and the **Expo Go** app on a phone (same Wi-Fi as the computer).

```bash
cd apps/mobile
npm install
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS). To see the demo: Settings →
long-press the app logo for two seconds → pick a persona.

Checks:

```bash
npx tsc --noEmit
npm test
npm run i18n:check
npx expo-doctor
```

Details, the demo script and what is simulated: [`apps/mobile/README.md`](apps/mobile/README.md).

## Run the backend (optional)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

To connect the app, copy `apps/mobile/.env.example` to `apps/mobile/.env` and set
`EXPO_PUBLIC_API_URL` to the backend address (without `/api/v1`). That value is bundled into the
app, so it is never a secret. API keys for the AI replies and the voice live only on the server:
see [`backend/AI.md`](backend/AI.md). Copy `.env.example` to `.env` for local values and never
commit `.env`.

## Documents

- [`docs/BUILD_SPEC.md`](docs/BUILD_SPEC.md): what we build and why (start with section W).
- [`docs/DEMO_AND_PITCH.md`](docs/DEMO_AND_PITCH.md): the demo, step by step.
- [`docs/MEMO_BODY_LOOP.md`](docs/MEMO_BODY_LOOP.md): the body loop.
- [`docs/DECISIONS.md`](docs/DECISIONS.md): decisions log.
- [`docs/PERSONAS.md`](docs/PERSONAS.md): the five synthetic personas.
- [`docs/research`](docs/research): sources for the baseline, the triggers and the small steps.

## Team: SISU Lab

| Name | Role | GitHub |
| --- | --- | --- |
| Meg | Product, spec, research, synthetic data, pitch | [@margita68](https://github.com/margita68) |
| Owais | Backend | [@muhammad-owais-javed](https://github.com/muhammad-owais-javed) |
| Uriel | Clinician overview | [@urielcont](https://github.com/urielcont) |
| Hugo | Mobile app | [@Hugo510](https://github.com/Hugo510) |

## About this repository

All project code was written during Junction 2026. Hacking started on 13 November at 19:30
(Helsinki time); the first commit contains only the repository structure, the license and the
conventions. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
