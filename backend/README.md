# Hiillos backend — PostgreSQL V2 preparation

Branch `uriel/database`, based on `origin/main` at `2561b6e`.
The V2 schema targets `origin/owais/backend` at
`f5d5698a6b55f2fa8212d4e9a42bf6b5a58749dc`, inspected without merging its code.
The local API remains the main-based version; schema preparation is not API integration.
The existing V1 draft files are retained and updated in place. Revision 20261114_0001
was not applied as V1. V2 was applied on 2026-11-15 to Hiillos.public; the
revision is now deployed and must not be edited. Future schema changes require
a new incremental migration. Do not replace an already deployed revision.
If V1 was applied anywhere else, stop and prepare a separate incremental migration.

## Current behavior

The HTTP API still uses its in-memory stores. Nothing imports the new database
factories at application startup. No endpoint, JSON contract, risk/priority rule,
409 behavior or token expiration behavior has been changed. No automatic schema
creation, seed data, startup migration or database connection is performed.

## Local setup

From `backend/`:

```powershell
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt
.venv/Scripts/python.exe -m unittest discover -s tests -v
.venv/Scripts/python.exe -m alembic heads
.venv/Scripts/python.exe -m alembic history
.venv/Scripts/python.exe -m alembic upgrade head --sql
.venv/Scripts/python.exe -m alembic downgrade 20261114_0001:base --sql
```

The last two commands emit PostgreSQL SQL only. They do not apply migrations,
read database credentials or open a connection. The tests likewise use metadata,
compiled SQL and mocked connectors, not SQLite or a live PostgreSQL service.
SQLAlchemy 2.0, Alembic 1.x and psycopg 3 are added to requirements. Existing
backend dependencies are left unchanged. Version ranges are not a deployment lock.

## Aiven configuration — do not connect or migrate until approved

1. Choose a dedicated Hiillos database and review its region, access controls and
   retention with the team. Never reuse an unknown existing database.
2. Obtain the actual service hostname and port from Aiven. Use the hostname,
   not an IP address, so hostname verification can succeed.
3. Download the project's CA certificate through Aiven and keep it outside the
   repository. Never disable certificate verification to work around TLS errors.
4. Provide a dedicated migration account with DDL privileges for the target
   schema. A later application account should have only required DML privileges.
5. Set the variables in `.env.example` through your shell or secret manager.
   The example has placeholders only. Copy it to ignored `backend/.env` and fill
   actual values locally. DatabaseSettings loads that exact file automatically,
   independent of the working directory. Process HIILLOS_DB_* variables override
   file values. DB_* aliases are not supported; do not maintain two conventions.
   Alembic refuses a database name other than Hiillos. Every connection fixes
   search_path=public; its version table is explicitly public.alembic_version.
6. `HIILLOS_DB_SSLMODE=verify-full` is the default and verifies the certificate
   chain and hostname using `HIILLOS_DB_SSLROOTCERT`. The CA file must exist.
   Other remote modes, including `require` without verification, are rejected.
7. Check the offline SQL, target database, grants and backup plan before running
   the following ONLINE commands, only after explicit authorization:

```powershell
# Connects to the configured database; NOT executed during this task.
.venv/Scripts/python.exe -m alembic current
.venv/Scripts/python.exe -m alembic upgrade head
.venv/Scripts/python.exe -m alembic check
```

No URL or password is stored in alembic.ini. Connection factories are lazy,
mask SQL parameters, use a small pool and never print credentials. The DSN is
built with SQLAlchemy URL.create so reserved password characters are escaped.
All settings use the `HIILLOS_DB_` prefix; port, name, user, password, SSL mode,
CA path and connection timeout are documented in `.env.example`. Relative CA
paths are resolved from backend/, never from the caller's current directory.

`disable` is accepted only for an explicit loopback host (localhost, 127.0.0.1,
::1) for a separately authorized disposable local test database. No local
PostgreSQL/Docker test instance was identified, started, probed or used here.

## Rollback

The initial migration has a downgrade in reverse dependency order, without
CASCADE. Online downgrade refuses to drop any of the nine application tables
if any contains rows (including sensor_aggregates). It is intended only for an empty/disposable deployment;
backups and a reviewed data migration are required for a populated deployment.
Offline downgrade SQL cannot perform the Python emptiness check: it is a preview,
not permission to execute DROP statements against an existing service.

See [schema and ER diagram](docs/database/SCHEMA.md),
[integration decisions](docs/database/DECISIONS.md), and
[validation report](docs/database/VALIDATION.md), and
[V1 → V2 compatibility](docs/database/COMPATIBILITY.md).

Official references:
- [SQLAlchemy PostgreSQL dialect](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html)
- [Alembic tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html)
- [Aiven TLS certificates](https://aiven.io/docs/platform/concepts/tls-ssl-certificates)

## V2 integration boundaries

Nine tables, including exactly one sensor_aggregates table. No night_hrv type,
intervention_outcomes, raw telemetry, GPS, chat/audio or new clinical algorithms.
Sensor types/units and enum snapshot are pinned to the inspected Owais commit.
Consent is checked in the future service, not inferred from a table or source flag.
Sensors support arbitrary positive intervals, not only 24-hour days.
The two new flags care_team_after_silence and wearable start false. All previous
consent columns keep their original semantics. The ordinary-check-in uniqueness
is now a partial index, so positive safety reports are not rejected by that index.
Nothing here automatically writes notes/emotions/body maps or syncs any observations.
