# V2 validation report — 2026-11-14

Target contract: origin/owais/backend f5d5698a6b55f2fa8212d4e9a42bf6b5a58749dc.
Local branch base: origin/main 2561b6e. Revision: 20261114_0001; the initial report preceded execution. See the application report below.

## Passed

- 17 offline unit tests (`python -m unittest discover -s tests -v`).
- ORM mapper configuration and all nine table dependencies resolve.
- Frozen Alembic upgrade reconstructed as metadata matches ORM columns, constraints,
  defaults, nullability, indexes and PostgreSQL partial predicates.
- Partial ordinary-check-in uniqueness; nullable energy/anxiety; kind default and
  enum; false defaults for both new consent flags; no automatic identity/time update.
- Optional patient-scoped alert/check-in composite FK; no uniqueness restricting
  several alerts for a patient or check-in; restrictive foreign-key deletes.
- Sensor type/unit/source enums match a metadata-only snapshot of Owais's source.
- Sensor interval, nonnegative/range/unit checks compile; aggregate upsert key is
  patient/type/start. No raw fields, HRV type, ms unit or second aggregate table.
- Hash-only session storage and digest helper; TLS configuration requires verify-full
  plus an existing CA file for remote hosts. URLs/error messages mask passwords.
- Engine factory is lazy; tests patch connectors and offline engine creation to fail
  if a connection is attempted. No server connection or certificate handshake occurs.
- Alembic heads/history load one head. Offline upgrade/downgrade SQL generated
  successfully; downgrade guard refuses populated tables in a mocked execution.
- Python compileall passed for app/db, alembic, tests. pip check passed.

## Environment

Python 3.14.5, SQLAlchemy 2.0.57, Alembic 1.20.1,
psycopg 3.3.9. Dependencies are in ignored backend/.venv.

## Not run / remaining evidence

No PostgreSQL test instance was identified or used. No SQLite substitution, Docker
service, Aiven access, migration apply/rollback, live FK/index enforcement, transaction,
concurrency, query-plan, autogenerate drift check or TLS handshake was run. Offline
SQL compilation is not proof of successful execution against the chosen server.

Before deployment, use an explicitly authorized disposable PostgreSQL test database
and verify: two ordinary entries rejected; several positive safety entries accepted;
same-patient FK enforced; wrong-patient references rejected; alerts without check-in
accepted; invalid sensor units/intervals rejected; whole-batch rollback; timestamp
preservation; consent/assignment checks in the eventual repository; upgrade followed
by alembic check; empty downgrade. Do not run these against Aiven until authorized.

## Scope

Existing endpoints, Pydantic models, memory stores, algorithms and mobile files are
unchanged relative to branch HEAD. The new database code is not wired into runtime.
No seed records, credentials, real patient information or sensor observations added.
No commit, push, deployed migration or branch merge performed.

## Final preflight — 2026-11-15 (no migration applied)

This later read-only check supersedes the earlier "no Aiven access" limitation
for connection validation only. It does not constitute a migration or DML test.

- Permanent convention: HIILLOS_DB_* in ignored backend/.env, loaded automatically.
  Former DB_* keys were renamed locally without printing credentials. File values
  and password preservation were checked in memory. Environment variables take
  precedence; legacy aliases are unsupported.
- Connection settings pin search_path=public. Alembic's online environment rejects
  any database other than Hiillos and uses public.alembic_version explicitly.
- 18 offline tests pass, including dotenv loading, canonical variable names,
  environment precedence and the explicit version-table schema.
- SQLAlchemy successfully connected using the same permanent settings, verify-full
  and the local Aiven CA. Server confirms TLSv1.3 and PostgreSQL 18.7.
- Effective destination: Hiillos, public, search_path public. The entire inspection
  ran with transaction_read_only=on and was rolled back on completion.
- No user tables, public relations, public types or alembic_version were found.
- Schema USAGE/CREATE permissions and native uuid/jsonb/timestamptz/date/numeric
  types are available. The initial V2 revision still defines nine application tables.
- Alembic heads/history and offline tests load the revision; no online upgrade,
  downgrade, CREATE/ALTER/DROP or patient-data write was executed.
- No endpoint, clinical algorithm, mobile file, commit or push changed in preflight.

At that preflight stage, the remaining gate was explicit user authorization before execution.
Recheck object absence before execution because the remote database can change.

## Authorized migration execution — 2026-11-15

- Explicit user authorization received to apply V2 to Hiillos.public.
- Immediately before execution: branch uriel/database; sole Alembic head
  20261114_0001; verify-full and Aiven CA; TLSv1.3; PostgreSQL 18.7; public empty;
  no prior alembic_version found. Read-only preflight transaction rolled back.
- Executed `python -m alembic upgrade head` once. Exit code 0.
- public.alembic_version contains exactly revision 20261114_0001.
- Created nine application tables: users, patients, professionals,
  patient_care_team, patient_consents, auth_sessions, check_ins, alerts,
  sensor_aggregates. Each has zero rows. Only technical migration bookkeeping
  was populated; no patients, users, tokens or sensor observations were seeded.
- Read-only post-verification matched PK names/columns (9), FKs and targets (11),
  uniqueness constraints (3), explicit indexes including partial predicates (10),
  and named CHECK constraints (26) against SQLAlchemy metadata.
- All constraints are validated; all indexes are valid and ready. Consent flags
  are boolean NOT NULL; both new consent defaults are false. Optional alert
  check-in references retain the same-patient composite FK. Sensors have all eight
  expected checks, including interval, type, source, unit and bounded values.
- Autogenerate initially treated the reflected default-schema alembic_version as
  an application table. Corrected the metadata comparison filter, not the database
  or applied revision; regression test added. No application-schema differences
  remain. This was a comparison false positive, not an Alembic execution error.
- 19 offline tests pass after the filter correction; git diff --check passes.
- No downgrade, further DDL, application-data writes, endpoint/mobile changes,
  commit or push. Current backend still uses its existing memory stores; these
  tables alone do not switch the API to persistent repositories.

The initial revision is now applied and must not be edited. Future schema changes
must use a new revision. Actual invalid-row insertion and concurrency tests were
not run against Aiven; post-verification used metadata queries and row counts only.
