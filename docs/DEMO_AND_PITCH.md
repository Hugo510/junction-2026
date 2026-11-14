# Hiillos — what Meg wants, the demo, the pitch (v5)

*SISU Lab · Sat 14 Nov 2026, 19:55 · from Meg to Hugo, Uriel, Owais. Replaces the demo story in BUILD_SPEC §3. Background: `MEMO_BODY_LOOP.md`.*

---

## 1. What I want (decided)

1. **The body loop is the headline:** one small step → how her body responds that night → Hiillos learns what helps *her*. The clinic loop is the **safety net**, not the story.
2. **Watch: yes.** Ring: only if it costs nothing. Build it source-agnostic (`wearableSource: "watch" | "ring"`), and in the pitch say "any watch or ring".
3. **The fire stays the hero image.** The body data supports it; it doesn't replace it.
4. **A demo that runs end-to-end on a phone beats one more feature.** Feature freeze is **21:00**; after that, bug fixes only.
5. **Honest claims only:** synthetic data, effects illustrative, never "treats", "detects relapse" or "diagnoses".
6. **EEG:** the clinic's EEG is her starting point, plus a research ask to the lab. No fake headset.

## 2. The demo (≈ 2.5 min, persona picker + "Advance 1 day")

| # | Screen | What the judges see | What we say | Criterion |
|---|---|---|---|---|
| 1 | **Home: Aino** | The fire, "Morning, Aino", one tap on the embers | "She doesn't open a tracker. Hiillos comes to her." | Ease · Creativity |
| 2 | **Body drift** | Her watch: night heart rate variability below *her* normal for several nights, later sleep, more time at home → Hiillos reaches out: "Your nights have been heavier. Two quick questions?" → two-question check | "Her body asks first. Compared only with herself." | Smart sensing |
| 3 | **Small step → body response** | Offers a walk → she does it → Advance 1 day → "After your walk, your night-time recovery was higher than your usual" | "Sense, respond, measure her body's answer." | Smart sensing |
| 4 | **Learned card** | "What helps you: walks", with the body reason | "It learns what works for **her**." | Smart sensing |
| 5 | **Switch to Juho** | Same card: sea sounds help him, walks don't | "Same app, opposite answer. That's personal learning." | Smart sensing · Creativity |
| 6 | **Switch to Elias** | Flu week: resting heart rate up, variability down → Hiillos asks → nine-question check stays low → **no clinic alert** | "The body can be wrong. Sensors ask, the questionnaire decides." | Usefulness |
| 7 | **Clinician screen** | Aino on the "call" list. Reason, e.g.: "night recovery below her normal for 9 nights; questionnaire 6 → 12". Line: "consider a review (e.g. booster, EEG check)" | "Only the calls that matter, each with a reason. The clinic decides." | Usefulness |
| 8 | *(10 s)* Safety | Self-harm answer → crisis screen | "Fixed rule, never a model." | Usefulness |
| — | *Optional* | Live heart rate from a team member's watch, shown only, never stored. **Only with everyone's yes** | "This is real data streaming now. The persona data is synthetic." | Smart sensing |

The numbers in the reason lines come from the synthetic data (B2) once it's generated. Don't rehearse fixed figures before then.

### Needed for the demo (owners as in the memo)

| Must have | Owner |
|---|---|
| B1: new sensor fields — **Hugo says yes to the names now**, so B2 can start | Hugo |
| B2: synthetic watch data for the 5 personas | Claude + Meg |
| B3: night heart rate variability added to the learning score (`rewardFor`) | Uriel |
| B4: learned card gives the body reason | Hugo |
| Clinician screen with reason line + review line (M4) | Uriel |

**Cut first if late:** B5 trend on the clinician screen → live heart rate → ring.

## 3. How I handle it in the pitch

**Open:** name story → "Treatment doesn't end at discharge. It changes form."

**Core line, in their words:** "Your brief asks for a loop: sense how someone is doing, respond with something that helps, learn what works for that person. Hiillos runs that loop through her body every night."

**Device:** "Any watch or ring, through Health Connect or HealthKit. Today's data is synthetic; the live heart rate is real." (Only say the second part if we show it.)

**Safety net, one slide:** "The body asks, the questionnaire decides, the clinician confirms."

**The ask to the lab:** "Home watch or ring data, paired with your EEG and TMS–EEG from treatment, person by person, between discharge and relapse. Something you don't have today."

**Close:** the four criteria, each with its proof from the demo → "Treatment doesn't end at discharge. It changes form."

### Q&A answers

| They ask | Meg answers |
|---|---|
| "Antidepressants change heart rate variability." | "Yes, more than depression does. That's why we only compare her with herself, and reset her baseline when her medication changes." |
| "Does it detect relapse?" | "No. The body raises a question, a validated questionnaire decides, the clinician confirms." |
| "Why not EEG at home?" | "A phone can't record it. Your clinic EEG is her starting point; a monthly portable EEG could be the research layer, never the alarm." |
| "Watch or ring?" | "Both work. The ring is better at night, the watch shows live data." |
| "Is it a medical device?" | "Not yet. A wellness companion today, with a deliberate medical-device path later." |
| "Which steps help, on evidence?" | "Behavioural activation, like walks, has the best evidence in our menu. We pitch the loop, not a cure." |

**Words we never use:** treats, cures, detects relapse, diagnoses, predicts.
