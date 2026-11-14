# Clinician overview (M4)

Read-only demo route `/clinician`, opened from Settings → long-press the logo → Clinician Overview.
No active patient store, repository writes, persona loading, chat changes or alerts.

## Calendar and data

All five registered v0.3 personas are evaluated against the same fixture date,
2026-11-15 plus the existing demo day offset. Their histories are not rebased
individually. The date is visible on screen. This preserves Sara's silence.
Future records are excluded. Scores are calculated by the shared priorityScore.

## Clinical distinctions

Priority sorts the display; it is not call-list membership or urgency.
BUILD_SPEC (origin/main at 9877db5), W0 and §7, and DECISIONS O6:
- Latest full PHQ-9 >=15: consider a review.
- Latest full PHQ-9 >=10 and >=5 above a documented personal PHQ baseline,
  confirmed by another qualifying result 7–14 days earlier: consider a review.
- No full result or missing baseline/confirmation for an elevated result: pending.
- Latest full result <10 (or <5 above a supplied baseline): call criterion not met.

The existing persona model does not identify a clinical PHQ baseline. Do not
infer one from the first/minimum score or use the mood baseline from priorityScore.
Therefore Aino (latest PHQ-9 12) remains pending in this version, despite priority 90.
The callStatus helper accepts an explicit baseline for later integration; the UI
supplies none. Watch status also remains undetermined without that baseline.
Historical positive safety answers are labeled separately; this screen does not
establish current urgency or create an alert. A low priority does not clear safety risk.

## Reasons

Display at most the first two reasons in priorityScore's rule-evaluation order.
They are not claimed to be the two largest contributors. No points are duplicated
or recalculated here. Existing translations explain the observed rules.

## Verification

From apps/mobile: npm ci; npm run typecheck; npm test -- --runInBand;
npm run i18n:check. New tests are in src/domain/__tests__/clinicianViewModel.test.ts.
They check scores, ordering, missing PHQ/baseline, call-rule boundaries, future data,
input immutability and absence of active-patient store access.

## Hugo integration

Integrated hugo/mobile at 7b0311d. Shared sensing rules now compute Aino at 90.
Clinical reason translations cover homeMore and laterNights without changing scoring.
Both reconnect and quiet retain the lost-contact indicator; quiet additionally shows
that outreach is paused after 30 silent days. Neither creates a clinical alert.
The active patient careEnded flag is never read or transferred to fixture personas.
