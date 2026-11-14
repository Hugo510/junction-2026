# V1 → V2 compatibility report

Branch: uriel/database. Worktree: D:/junction-2026-uriel-database.
Code base remains origin/main at 2561b6e. Target persistence contract is
origin/owais/backend at f5d5698a6b55f2fa8212d4e9a42bf6b5a58749dc.
No branch merge or backend business changes are part of this work.

## Initial revision history

V1 was prepared, not committed, pushed or applied to PostgreSQL. Its initial
revision 20261114_0001 is updated in place, not followed by a fictitious migration
from a database state that never existed. The files and their safety provisions
remain; this report records the incompatible V1 assumptions replaced by V2.
If anyone applied V1 elsewhere, stop: editing an applied revision is not a valid
upgrade. Prepare and review an incremental migration instead; never stamp over it.

| V1 | V2 |
|---|---|
| Eight application tables | Nine; sensor_aggregates is the only new table |
| Unrestricted patient/day uniqueness | Partial unique index for self_harm_thoughts=false |
| Required energy/anxiety | Nullable, range retained when present |
| No kind | full/chat/journal, default full |
| Four consent flags | Four preserved plus care_team_after_silence/wearable default false |
| No sensor storage | Scalar interval table matching Owais's type/start upsert |
| Alert optional scoped check-in FK | Preserved, no uniqueness restricting multiple alerts |
| Hash-only auth, TLS verification, restricted deletes | Preserved |
| Empty-table downgrade safeguard | Preserved and extended to sensors |

## Exact field mapping

- CheckInCreate.energy/anxiety → nullable integer columns.
- CheckInCreate.kind → kind; full default, no invented measurements.
- Consents.careTeamAfterSilence → care_team_after_silence.
- Consents.wearable → wearable.
- SensorAggregate.type → sensor_type.
- periodStart / periodEnd → period_start / period_end, timezone-aware instants.
- value / unit / source → same-named scalar columns.
- SensorBatch.items → one DB transaction, after per-type consent validation.
- No backend wire id exists for aggregates; internal UUID and reception timestamps
  do not change the endpoint's accepted count response.
- Snapshot fixture tests/fixtures/owais_contract_v2.json records allowed enum values
  extracted from the inspected source, containing no observations or identities.

Main still lacks this latest sensor route and has older check-in nullability. The
schema therefore intentionally targets newer Owais, not local Pydantic imports.
Physical compatibility does not activate synchronization. Current mobile HRV
nightHrvMs has no allowed SensorType counterpart, and no ms unit is accepted.
Intervention learning stays mobile/local; intervention_outcomes is not included.

## Runtime obligations not implemented by DDL

Preserve safety-history immutability and replacement id/created_at; atomic alert
creation; role/assignment authorization; atomic sensor batch upserts and consent;
keep updates of sensor UUID/created_at out of conflict handlers. No triggers
reimplement risk, priority or clinical decisions. No real observations are seeded.

## Applied V2 — 2026-11-15

Revision 20261114_0001 was applied once, with explicit user authorization, to
Aiven Hiillos.public over TLS verify-full. The nine application tables are empty.
The initial revision is now immutable; any future database change must be a new
migration. No downgrade or data seeding was performed. See VALIDATION.md.
