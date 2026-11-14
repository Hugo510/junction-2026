# Decisions pending before connecting persistence to FastAPI

The migration is infrastructure only. All existing routers/services/schemas/stores
remain unchanged and continue to use memory. Existing duplicate GET/PATCH /me
registrations remain in the local main-based API. Owais f5d5698 has removed them;
this task does not merge that backend or change its HTTP code.

1. Safety and 409: target Owais f5d5698 has fixed rejection of positive POST
   duplicates and prevents PUT from replacing safety reports. V2 must preserve
   those rules. The local main-based HTTP code is unchanged and still has the old
   behavior until Owais is integrated. Do not deploy the V2 repository against an
   unreviewed older service and assume the schema fixes safety behavior.
2. Repeated positive POST/PUT operations may still produce several alerts. Define
   event idempotency deliberately; no uniqueness on patient/day or check-in is
   added to alerts that could suppress legitimate safety events.
3. Transactions: future repository must atomically write a check-in and required
   urgent alert. Map only uq_check_ins_ordinary_patient_date violations to ordinary
   duplicate 409. PUT must update the replaceable row, preserving id/created_at;
   no upsert/delete-reinsert or broad IntegrityError swallowing. Never overwrite
   an existing positive safety report; enforce that in the service/repository.
4. Notes: decide whether free-text notes may leave the device, allowed purposes,
   minimization, retention and deletion. The nullable column does not activate sync.
   Raw GPS/sensors, individual taps, trusted-contact details and full conversations
   are excluded from this schema.
5. API/mobile mismatch: backend one ordinary entry per day vs mobile multiple chat/journal entries;
   target Owais now accepts nullable energy/anxiety and kind; UUIDs vs mobile strings;
   human vs person; consent names and careTeamAfterSilence. No silent coercions.
6. Role and authorization: enforce patient/doctor profile consistency and patient
   assignment in a future transactional service. A FK only proves identity, not
   permission. patients/professionals are optional user profiles, not diagnoses.
7. Alert ids currently typed as strings are stored as UUID/FKs, per the internal
   identity requirement. Acknowledgement routes do not exist yet. Define whether
   acknowledgement requires both timestamp and professional before tightening rules.
8. Sessions: use hash_session_token from app.db.tokens before inserting or looking
   up the current high-entropy token. Never log/store the bearer token. Nullable
   expiry preserves the absence of a current expiry policy; enabling expiration or
   revocation checks is separate business work. SHA-256 is not a password scheme.
9. Priority: existing backend seven-day formula differs from mobile priorityScore.
   Do not reconcile algorithms in a schema migration or persist a guessed score.
   PHQ baselines/call lists remain future scope with explicit unknown states.
10. Deletion/audit/retention and least-privilege accounts require team decisions.
    No blanket ON DELETE CASCADE, no production-data purge and no inferred care end.
11. TLS, backup, region, connection limits, schema ownership and application vs
    migration roles must be reviewed before Aiven access. Dependencies have bounded
    added ranges; agree on a full deployment lock separately.
12. New main at 2561b6e includes companion/voice services. They remain untouched;
    this schema intentionally does not persist prompts, responses or audio.

## V2 sensor decisions before integration

- No HRV type, ms unit, outcomes table, or device-level raw telemetry is added.
- Runtime consent mapping must remain: activity/steps → motion; outdoor_daylight →
  approximate_location; screen_engagement → touch_pattern; sleep/resting_heart_rate
  → wearable. Validate/recheck consent consistently with transaction boundaries.
  A physical FK to the patient is not upload authorization or continued retention.
- Keep original consent flags; new wearable and care_team_after_silence default
  false. The mobile mirror can currently send flags without wearable, causing a
  default-false reset: coordinate partial/full replacement semantics with the team.
- Notes, emotions and body_map: nullable note remains from V1 to avoid silently
  deleting the prepared field. No note sync is enabled. Emotion/body-map columns
  are intentionally absent until explicit storage authorization and a mapping
  policy are agreed; don't silently discard them when implementing a repository.
- Source/body-loop alignment: source accepts phone/wearable/manual/synthetic,
  while mobile distinguishes watch/ring. HRV and local evening attribution remain
  unsupported server contracts; do not hide them in an unvalidated JSON payload.
- Nonfinite float values: the Python sensor validator does not explicitly reject
  NaN/Infinity for all types. SQL range comparisons differ for NaN. Agree finite
  measurement validation before production; ordinary finite contract values are
  preserved. No medical threshold or scoring rule is introduced by this schema.
- Sensor upsert must set updated_at explicitly, keep original UUID/created_at,
  and match the all-or-nothing batch. No automatic persistence or endpoint adapter
  has been added. No Aiven connection or migration has been executed.
