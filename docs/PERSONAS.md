# Hiillos — demo personas (SYNTHETIC)

*All personas are invented. All data is synthetic and labelled so. Effect sizes in the generator are made up for the demo, not calibrated to real patients — say so in the pitch if asked.*

## Common setup
- **90 days** per persona, daily rows.
- All five start in state **B5 post-TMS** ("I've just finished treatment at the clinic"), so the demo stays on one path.
- **Baseline window:** first 14–28 days. Drift is measured against the person's **own** baseline, in both directions.
- **Daily signals** (from BUILD_SPEC §6): bedtime + regularity, sleep duration, steps, % time at home, night-time phone use, daytime light, 1-tap mood, HRV (weak, optional).
- **Check-ins:** 1-tap mood daily; PHQ-9 every 2 weeks, plus extra PHQ-9s when Hiillos reaches out.
- **Files:** `personas/<id>/core.json` (read by the app) · `personas/<id>/ground_truth/` (NOT read by the app: when drift starts, what helps, expected rule triggers) · every file carries `synthetic: true`, generator version and seed.
- **Format of `core.json`:** draft schema read from Hugo's repo in BUILD_SPEC §12.3 — **Hugo to confirm** (DECISIONS O5). Field names follow the app's existing types (`checkIns`, `sensors`, `feedback`) plus new `phq9`, `homeMinutes`, `bedtime`, `steps`, `nightPhoneMinutes`.

## The five

| # | Persona (editable names) | Story over 90 days | Rules it demonstrates |
|---|---|---|---|
| 1 | **Aino, 42 — drift caught early, walks help** *(main demo story)* | Discharge PHQ-9 = 6; her early signs: sleeps later, stays home, irritable. Week 3: time at home up and bedtime later for 5 of 7 days → reach out → walk → mood better. Two weeks later PHQ-9 = 12 twice. | Reach out + extra PHQ-9 (no clinician alert from signals); action + "did it help?"; "call" list with one-line reason (PHQ-9 ≥ 10 and ≥ 5 above baseline on 2 checks). |
| 2 | **Leena — stays well** | Signals stay inside her own range; PHQ-9 stays low. | "Remission" label (PHQ-9 < 5 on all checks ≥ 3 weeks); quiet mode; fire grows with self-care. |
| 3 | **Juho — drift, music helps, walks don't** | Similar drift; walk prompts don't lift his mood taps, music does. | Learning per person which action helps, including "no prompt". |
| 4 | **Sara — patchy data** | Check-ins and data thin out, then stop for days. | Silence ladder (2 / 4 / 7 days) → "lost contact" tag. Missing data is **not** treated as relapse on its own. |
| 5 | **Elias — false alarm** | One week of flu / travel / a deadline: time at home and bedtime move out of his range. Hiillos reaches out; PHQ-9 stays low; signals return to normal. | "Sensors only ask, questionnaires decide, humans confirm": reach out + extra PHQ-9, kind reply, **no clinician alert**. Shows we don't flood clinicians. |

**Safety path** (PHQ-9 item 9 > 0 → crisis screen + clinician alert) is shown as a separate **simulated** 10-second step in the demo, not built into a persona's 90 days.
