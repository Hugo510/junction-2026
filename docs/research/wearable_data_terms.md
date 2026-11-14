# Wearable data and AI: what the provider terms allow (for Hiillos)

*14 Nov 2026. **Not legal advice.** Main source: Sahha blog, "Can You Feed Wearable Data to an AI?" (Sugam Budhraja, 28 Aug 2026). It is a developer's reading of the public agreements. Before any real integration, read the agreements themselves and get counsel.*

## Where we are this weekend: no exposure

- We use **only synthetic data** (`tools/synthetic/`). We do **not** connect to any Oura, Garmin, Fitbit, WHOOP or Strava API.
- **Ring layer v0.4 calibration:** the night-to-night noise comes from PMData *summary statistics*. PMData is CC BY 4.0 per Simula; a Hugging Face mirror says CC BY-NC. We copied no data and credit the source.
- The Junction/Oura-like field names in `ring.json` are only a format.

## Provider matrix (as reported by the blog, Aug 2026)

| Provider | AI position | What it means for Hiillos |
|---|---|---|
| **Oura** cloud API (API & MCP Agreement, 8 Jun 2026) | **Direct developers** may feed data to an AI at inference time, with user consent. **Aggregators** (anyone passing data or anything *derived* from it to third parties) may not use AI at all. **Everyone** is barred from training, embeddings, "persistent representations", and storing or caching beyond the allowed periods. | ⚠️ Our core idea — a stored **personal baseline** and per-person learning — may clash with the storing/persistence bans. ⚠️ Passing Oura-derived scores onward could make us an "Aggregator". → Option: a separate written agreement with Oura (§2(d)). |
| **Garmin** (Connect Developer Program Agreement, §15.10) | **Allowed**, including training, **if** the privacy policy has a prominent *AI Transparency Statement*, explicit consent is collected first, consent is easy to withdraw, and Garmin may audit. | ✅ The clearest path for a **smartwatch**: consent screen + AI statement. |
| **Apple HealthKit** (App Review 5.1.2(vi), 5.1.3(i)) | Says nothing about AI. Bans advertising, marketing and data mining, except for health management or research, with permission. | ✅ Reading **on the phone** (Oura and others sync to Apple Health) falls under Apple's rules, not the device maker's API agreement. Health management is our purpose. |
| **Google Health API / Health Connect** (policy, 24 Mar 2026) | Says nothing about AI. Bans transferring or selling data to third parties, even aggregated or anonymised. | ✅ Same on-phone logic for Android. Keep data and scores out of third-party hands. |
| **WHOOP** | Says nothing about AI. | Silence is **not** permission. Strava said its old terms "already disallowed" AI before it wrote this down explicitly. |
| **Strava** (API Policy, 1 Jun 2026) | **Prohibits** AI use, even putting data into a prompt. Bans combining its data with other data. | ❌ Do not use. |
| **Fitbit Web API** | Reported **switched off on 2 Nov 2026** (Terra blog). | Use Google Health / Health Connect instead. |

## Design choices that keep us safe (already our architecture principles)

1. **Read on the phone** through Apple Health / Health Connect, not through vendor cloud APIs, wherever possible. The "pathway is the licence", not the brand.
2. **Compute on the phone, send only scores** (`docs/DECISIONS.md` architecture principle). This minimises transfer under GDPR and the vendor terms.
3. **Tag every record with its provenance** (`source.provider`). The app can then keep restricted sources out of any AI/LLM step and out of anything stored long-term.
4. **The companion chat (LLM) never sees raw wearable data**, only the person's own check-in words plus a short, generic state ("sleep later than usual"). Even that needs a per-provider check.
5. **Consent screen + AI Transparency Statement** in the privacy policy from day one (needed for Garmin, good practice everywhere).
6. **Oura cloud integration only after legal review** or a written agreement with Oura.

## One line for the pitch

*"Hiillos is device-agnostic: it reads health data the person already has on their phone, keeps the learning on the phone, and integrates each vendor under that vendor's terms."*
