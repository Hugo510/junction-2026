# Portable EEG in Hiillos — brief for Uriel

*SISU Lab · Junction 2026 · Sat 14 Nov, 18:45. Pulled from BUILD_SPEC v4.8 (W0, C4, M4), DECISIONS O25 and the signals research note. Nothing new is decided here; open items are marked.*

---

## 1. The idea in one line

**EEG is a research layer in the clinic loop, not an alarm.** A phone can't record EEG, and the judges are TMS–EEG experts, so we don't fake it. The clinic's own EEG / TMS–EEG from treatment is part of the person's starting point. When Hiillos sees drift at home, the clinician screen can suggest "consider an EEG check or booster review". The clinic decides.

*(Decided by Meg 10:35, logged as O25.)*

## 2. What this means for your build tonight

Feature freeze is **21:00**. In order:

**a) Inside M4 (your clinician screen) — must.** For people on the "call" list, one line:
> *Consider a review (e.g. booster, EEG check).*

It's a suggestion for the clinic, never shown to the patient (guardrail 2: we never say anything about treatment to the person).

**b) C4 — EEG card on the clinician screen — "could", only once M4 works.**
- **Title:** "EEG — research layer, not an alarm"
- **Shows:** band power (delta / theta / alpha / beta), eyes closed, from **one** subject of the open dataset. A simple bar chart is enough.
- **Label under it:** "Example resting EEG — open research recording, not this person."
- **Footer:** "No validated EEG marker for depression exists. In care, the clinic's own EEG from treatment would be the starting point."
- **Data:** OpenNeuro **ds003478** "EEG: Depression rest" (Cavanagh, CC0, doi 10.18112/openneuro.ds003478.v1.1.0), processed with Meg's `healthdeeptech-starter/examples/eeg_rest_openneuro.py`. Meg exports 2–3 subjects to CSV; you read one as a static file (no network, no backend).
- **Be honest about the data** (Q&A, or a small "about this data" tap): students aged 18–24, not post-TMS, one visit each, no relapse labels.
- **Open:** has Meg exported the CSV yet? Agree the column layout with her (match whatever the script outputs).

**c) Not this weekend:** live EEG from a headset.

## 3. One thing to ask the mentors

The challenge booth may have a **portable EEG demo** ("brainwaves in real time"; the brief says this still has to be confirmed with the lab). Ask whether we could record **one real minute** for the demo or a pitch photo. That's a bonus. Nothing should depend on it.

## 4. What the evidence says (for Q&A)

*From our research note (`junction2026_research_depression_symptoms_signals.md`). Most of it comes from abstracts, so check the papers before quoting numbers on a slide.*

- **Overall:** a 52-article review says there is **no established method** to detect depression from EEG. The very high accuracies you'll see quoted come from small datasets that are prone to leakage.
- **Frontal alpha asymmetry** (the classic "Muse" feature): a meta-analysis found **no reliable difference** (16 studies). Don't make it a headline.
- **Portable 3-channel forehead EEG:** its spectra matched a 128-channel lab system closely. High-alpha power was only weakly related to PHQ-9 (n = 40, group-level).
- **Daily home EEG and mood:** only a **10-person pilot**. The frequencies that tracked mood **differed from person to person**, which fits our "your own normal" design.
- **EEG as a predictor of rTMS response:** mixed results. Some non-linear measures look better than plain band power. This is the Aalto group's own field, so ask them rather than tell them.

**The line to say:** *"A within-person trend of resting EEG, anchored to the clinic's pre-TMS recording, as a research layer. Not 'detects depression from EEG'."*

## 5. Don'ts

- No "EEG detects relapse" or "EEG diagnoses" anywhere: UI, pitch or README.
- EEG never triggers an alert or a reach-out. It **stays out of the alarm path**.
- Never present the open-data subject as one of our personas.

---

## 6. Plans for later (roadmap, not this weekend)

**EEG track**
1. **Monthly home EEG as a research measurement**, linked to the clinic's pre-TMS recording, read only against the person's own baseline. It feeds the learning layer once there's within-person evidence.
2. **Per-person calibration:** the pilot suggests each person's informative frequencies differ, so the model learns *her* EEG signature rather than using a population threshold.
3. **Research with the Aalto TMS group** (the "most promising idea" prize): does a personal signature recorded at TMS discharge predict the next episode? Nobody has tested this after TMS.
4. **Home stimulation as a plug-in action:** Sooma (FI) and Flow (SE) home tDCS. Hiillos becomes the layer that decides *when* maintenance is needed.

**Other ideas parked as plans** *(from the spec's roadmap slide)*
- Real sensors through **Health Connect / HealthKit**; wearables (Polar, Thryve: claims still to verify).
- **Voice** with a fixed reading prompt in the person's own language, compared only with that person's baseline. We found no Finnish or Swedish studies, so no English-trained classifiers.
- **FHIR** export (PHQ-9 as `QuestionnaireResponse` / `Observation`), Synthea for scale, EHR/Kanta write path.
- Real push notifications, camera pulse, 3D music meditation, LLM companion.
- **Medical-device (MDR) path** for the clinician view and relapse detection. It's part of the investment story.
- Community-support actions (MIELI, Sekasin-chat), and the hologram / ember lamp if they don't happen this weekend.

*Source docs: `docs/HIILLOS_BUILD_SPEC.md` (W0, C4, M4, W5, §4), `docs/HIILLOS_DECISIONS.md` (O25), `docs/research/` signals note. Also in the Junction project as `claude/EEG_FOR_URIEL.md`.*
