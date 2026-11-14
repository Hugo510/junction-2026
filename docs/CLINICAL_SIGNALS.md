# Clinical signals for depression — what the evidence supports

*SISU Lab · Junction 2026 · Sat 14 Nov, 19:30. Pulled from the team research note "Score symptoms first, let sensors prompt" (Junction project: `claude/junction2026_research_depression_symptoms_signals.md`). Nothing new researched; flags kept as in the source. For the clinician screen, pitch and Q&A.*

**Flags:** **[verified]** = read on the linked page · **[abstract]** = from an abstract via Consensus, full paper not read · **[secondary]** = press release or review summary · **[UNVERIFIED]** = standard figure from background knowledge, not checked. Check anything not **[verified]** before it goes on a slide.

---

## 0. Bottom line

- The clinical signal with real evidence is **a validated self-report scale on a fixed schedule, with an action tied to each threshold**. In an RCT, scheduled scoring plus decision rules took remission from **28.8% to 73.8%** (Guo 2015, n = 120, acute medication phase, not post-TMS) [verified].
- Monitoring **without** predefined actions did not improve symptoms (MONARCA II) [verified].
- **No sensor is validated for detecting relapse.** Nearly all sensor evidence compares groups of people; Hiillos needs change *within one person*.
- Hence our rule: **sensors ask, scales decide, humans confirm.**

## 1. The symptoms that define depression

**DSM-5 major depressive episode:** at least **5 of 9 symptoms for 2 weeks**, as a change from before. At least one must be depressed mood or loss of interest [verified, via MDCalc]:

1. Depressed mood most of the day, nearly every day
2. Markedly reduced interest or pleasure
3. Weight or appetite change (**up or down**)
4. Insomnia or hypersomnia (**too little or too much sleep**)
5. Psychomotor agitation or slowing that others can see
6. Fatigue or loss of energy
7. Worthlessness or excessive guilt
8. Poor concentration or indecisiveness
9. Thoughts of death, suicidal ideation, a plan or an attempt

**What ICD adds, and why it matters in Finland:**
- Finland codes with **ICD-10** (F32 single, F33 recurrent). There, **reduced energy is a core symptom**, which it is not in DSM-5 [UNVERIFIED].
- ICD-10 and ICD-11 include **hopelessness / a bleak view of the future**. Neither PHQ-9 nor QIDS asks about it directly, so a daily "how hopeful do you feel about the coming days?" item would close the gap.
- ICD-11 has codes for **partial remission (6A70.6)** and **full remission (6A70.7)**, which give the clinician screen ready-made labels [verified].
- The Finnish Current Care rule, as cited in a 2026 lecture: **at least 2 core symptoms and at least 4 of 10 in total, for at least 2 weeks** [secondary].

**Subtypes move signals in opposite directions:**
- **Melancholic:** early waking, worse mornings, weight loss.
- **Atypical:** **more** sleep and **more** appetite.
- **Seasonal:** risk in autumn and winter, which matters in Finland.

So "less sleep = worse" misses half the people. The baseline must learn **which way each person moves** [specifiers UNVERIFIED in detail].

## 2. Early-warning signs: the strongest argument for a personal signature

- **A prodrome comes before episodes**, typically **anxiety, tension, irritability and physical complaints**. It can last from under a month to several years (systematic review, 25 longitudinal studies, 2021) [verified abstract].
- **Each person's prodrome repeats across their own episodes**, and it looks like their **residual symptoms** from the last episode [verified abstract]. That is the evidence behind S3, "the clinic sets the early signs".
- Anxiety and irritability come early, so a depression-only scale can miss the first signs. This supports adding **GAD-7** or one anxiety/irritability item.
- **Residual symptoms raise relapse risk:** each extra point raised the relapse hazard by about 7% (HR 1.07, individual-patient meta-analysis, Breedvelt 2021) [verified]. The older "76% vs 25%" figure (Paykel 1995) is [UNVERIFIED].
- **No source showed that any single symptom, such as sleep, reliably comes back first.**

## 3. Scales and thresholds

| Instrument | What it is | Threshold / rule | Status |
|---|---|---|---|
| **PHQ-9** | 9 items = the 9 DSM symptoms, **past 2 weeks**, 0–27. Free. Finnish version presented by THL; HUS uses it at rTMS referral | Bands 5 / 10 / 15 / 20 = mild / moderate / moderately severe / severe. **≥ 10** is the best cut-off: sensitivity 0.88 and specificity 0.85 against semi-structured interviews (n = 17,357). **About half of positive screens in primary care are false positives**, so a clinician confirms | [verified] Kroenke 2001, Levis 2019, THL |
| **PHQ-9 change (THL)** | — | **≥ 5-point** change counts. THL calls start ≥ 10 → end < 10 with a ≥ 5 drop "recovery" (not the same as the ACNP "recovery" in §4) | [verified] |
| **PHQ-9 item 9** | Thoughts of being better off dead or of self-harm | **Any answer above 0:** about **10× the one-year rate** of suicide attempt (0.4% → 4%) and death (0.03% → 0.3%), "nearly every day" vs "not at all". Excess risk **starts within days and lasts months** (n = 84,418) | [verified] Simon 2013 |
| PHQ-9 remission | — | < 5 | [UNVERIFIED] |
| **PHQ-2** | First 2 items (mood, interest) | ≥ 3 → full PHQ-9 *(the rule M3 uses)* | [UNVERIFIED], check before the pitch |
| PHQ-8 | PHQ-9 without item 9 | For use when no human can follow up on a safety answer | [UNVERIFIED] |
| **QIDS-SR16** | Self-report, 7-day recall | ≤ 5 remission, 6–8 partial response, ≥ 9 non-response (Guo trial rules) | [verified]; Finnish version not confirmed |
| HAM-D17 / MADRS | Clinician scales; likely what the TMS clinic holds | HAM-D remission ≤ 7 [verified]; MADRS remission ≤ 10 [UNVERIFIED]. A PHQ-9 crosswalk exists but was not verified | mixed |
| GAD-7 | Anxiety, past 2 weeks | ≥ 10 | [UNVERIFIED] |
| C-SSRS screener | Structured follow-up after item 9 > 0; cited in a Finnish Current Care lecture | — | [secondary] |

**Cadence:** PHQ-9 every **2 weeks**, matching its recall window and the Guo spacing. Weekly use overlaps the windows. **No guideline gives a monitoring frequency for the maintenance phase**, so our cadence is an inference.

## 4. Time rules: non-remission, relapse or recurrence

ACNP Task Force 2006 [verified abstract]:

| Term | Meaning | Time rule |
|---|---|---|
| Response | ≥ 50% drop from baseline | — |
| **Remission** | Minimal symptoms | **3 weeks in a row** |
| **Relapse** | The same episode returns | Within **4 months** of remission |
| **Recovery** | The episode is over | **≥ 4 months** of remission |
| **Recurrence** | A new episode | After recovery |

**For the clinician screen:** many patients leave TMS as partial responders. Someone who never had 3 weeks of minimal symptoms is in **continued non-remission**, not relapse, and the clinic may respond differently. **No guideline defines relapse with PHQ-9 scores**, so our "call" rule is an inference.

## 5. Measurable signals, ranked by evidence

*Almost everything here compares groups at one point in time. None of it has been tested after TMS.*

| Signal | Direction in depression | Key number | Evidence | Main pitfall |
|---|---|---|---|---|
| **Daily steps** | More steps, fewer symptoms | **RR 0.91 per +1,000 steps/day** (prospective). 33 studies, n = 96,173 | **Moderate** [secondary]; 27 of 33 studies cross-sectional | Phone left on the table |
| **24-h rest-activity rhythm** | Flatter day–night contrast | n = 91,105 (UK Biobank); odds ratios not retrieved | **Moderate** [secondary] | Needs night wear |
| **Light exposure** | Night light: risk about +30%. Daylight: about −20% | n = 86,772 | **Moderate** [secondary], observational | Sleeves cover wrist sensors |
| **HRV (RMSSD)** | Lower | g = −0.46, 21 studies | **Moderate** for a group difference [verified] | **Antidepressants lower HRV more than depression does**, so read it within one person only |
| Sleep timing and duration | Either direction (§1) | — | Symptom-level | Use timing and duration, not consumer sleep stages (not validated in depression) |
| **GPS / time at home** | Less movement, more time at home | r ≈ −0.6 vs PHQ-9 | **Weak**: n = 28, 2 weeks, authors call it "very preliminary" [verified] | Battery; sensitive; 12 of 40 excluded for missing data |
| **Phone use / screen time** | Linked to PHQ-9, but **the sign differs between the paper's abstract and results** | r = −0.54 | **Weak and inconsistent** [verified] | Confounded by work and habits |
| Typing rhythm | More variable, longer pauses | Effects of a few % | Weak–moderate [verified] | Age effects are larger |
| Voice, change within a person | Tracks improvement | n = 1,857 with replication | **Emerging** [abstract] | Use a fixed prompt; no Finnish or Swedish studies |
| Voice pitch alone | — | Not significant | Meta-analysis, **negative** [abstract] | — |
| EEG | — | "No established method" | **Weak** [abstract]; frontal alpha asymmetry **negative** [verified] | See `EEG_FOR_URIEL.md` |
| EDA / skin temperature | — | No depression study found | Very weak | — |
| Mood instability ("critical slowing down") | Rising variance and autocorrelation before shifts | Group level | Exploratory [verified abstract] | Needs dense check-ins; not an alarm |
| Missing check-ins / wear | May mean withdrawal | — | Inference | Nudge and "lost contact" tag, **never** counted as relapse evidence |

**Relapse prediction from combined signals:** AUC 0.70–0.88, mostly internally validated, 75% of studies at high risk of bias (Fang 2026) [abstract]. **Don't quote this as real-world accuracy.**

---

## 6. How Hiillos lines up with this (honest check)

| Hiillos uses | Evidence | Note |
|---|---|---|
| PHQ-2 → PHQ-9, with item 9 → fixed safety rule | **Strongest** | The core of our claim. Check the PHQ-2 ≥ 3 cut-off and the official fi/sv wording (O28) |
| "Call" list: PHQ-9 ≥ 10 and +5 vs her baseline, twice; or any ≥ 15 | Thresholds verified; the combination is our inference | Say "transparent rules the clinic can tune" |
| Clinic sets the early signs (S3) | **Supported:** prodromes repeat within a person | Good pitch line |
| Two-sided drift vs her own baseline | **Supported:** subtypes move in opposite directions | — |
| Activity, daylight | **Moderate** (steps, light) | Our best-backed sensors |
| **Time at home, screen-off time** | **Weak** (n = 28 GPS study; phone-use results inconsistent) | Present them as *prompts for a question*, never as markers. ⚠️ The spec's "1,013-person study, 2 weeks ahead" claim for time at home **is not in our research note**. Find the source or drop the number |
| Screen-off **regularity** (bedtime rhythm) | Rhythm evidence is moderate, but it comes from wrist actigraphy, not phone screens | A phone screen is a proxy for sleep timing; label it that way |

**Missing from Hiillos, cheap to add later:** a hope / future-outlook item (ICD), an anxiety/irritability item or GAD-7 (prodrome), and steps.

## 7. Before anything goes on a slide

- Confirm the item-9 pathway, the crisis-line number and the regulatory status with the clinical partner. An app that alerts clinicians about suicidality is likely an MDR medical device (inference).
- Check every [UNVERIFIED] figure above at its primary source.
- Say "illustrative, not calibrated" for any synthetic effect size.

*Source: research note "Score symptoms first, let sensors prompt" (Junction project, `claude/junction2026_research_depression_symptoms_signals.md`); not yet in this repo.*
