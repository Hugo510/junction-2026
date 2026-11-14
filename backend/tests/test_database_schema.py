"""Offline validation only: these tests never connect to a database."""
import importlib.util
import io
import json
import re
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from alembic import command
from alembic.config import Config
from pydantic import ValidationError
from sqlalchemy import ForeignKeyConstraint, Index, MetaData, Table, update
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import configure_mappers
from sqlalchemy.schema import CreateIndex, CreateTable
from sqlalchemy.sql.elements import conv

from app.db.base import Base, include_application_object
from app.db import models
from app.db.config import DatabaseSettings, TARGET_SCHEMA

ROOT = Path(__file__).resolve().parents[1]
REVISION = ROOT / "alembic/versions/20261114_0001_initial.py"
TABLES = {"users", "patients", "professionals", "patient_care_team", "patient_consents", "auth_sessions", "check_ins", "alerts", "sensor_aggregates"}


def load_revision():
    spec = importlib.util.spec_from_file_location("initial_schema", REVISION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class SchemaTests(unittest.TestCase):
    def test_autogenerate_excludes_only_reflected_public_version_bookkeeping(self):
        for schema in [None, "public"]:
            technical = Table("alembic_version", MetaData(), schema=schema)
            self.assertFalse(include_application_object(technical, "alembic_version", "table", True, None))
        other = Table("alembic_version", MetaData(), schema="other")
        self.assertTrue(include_application_object(other, "alembic_version", "table", True, None))
        for table in Base.metadata.tables.values():
            self.assertTrue(include_application_object(table, table.name, "table", True, None))

    def test_exactly_nine_tables_and_mappers_configure(self):
        configure_mappers()
        self.assertEqual(set(Base.metadata.tables), TABLES)
        self.assertEqual(len(Base.metadata.sorted_tables), 9)

    def test_online_downgrade_refuses_nonempty_tables_before_any_drop(self):
        revision = load_revision()
        with patch.object(revision.context, "is_offline_mode", return_value=False), patch.object(revision.op, "get_bind") as bind, patch.object(revision.op, "drop_table") as drop:
            bind.return_value.execute.return_value.scalar_one.return_value = True
            with self.assertRaisesRegex(RuntimeError, "not empty"):
                revision.downgrade()
            drop.assert_not_called()

    def test_hash_helper_returns_only_the_digest(self):
        from app.db.tokens import hash_session_token
        digest = hash_session_token("fictitious-high-entropy-token-for-unit-test")
        self.assertEqual(len(digest), 32)
        self.assertEqual(digest, hash_session_token("fictitious-high-entropy-token-for-unit-test"))
        self.assertNotEqual(digest, hash_session_token("different-fictitious-token"))

    def test_optional_reaction_and_consent_timestamp_remain_nullable(self):
        table = models.CheckIn.__table__
        for name in ["energy", "anxiety", "sleep_hours", "note", "reaction_rounds", "reaction_mean_ms", "reaction_sd_ms", "reaction_accuracy"]:
            self.assertTrue(table.c[name].nullable, name)
        self.assertFalse(table.c.self_harm_thoughts.nullable)
        self.assertTrue(models.PatientConsents.__table__.c.updated_at.nullable)
        self.assertTrue(models.Alert.__table__.c.check_in_id.nullable)

    def test_uniqueness_and_same_patient_alert_reference(self):
        table = models.CheckIn.__table__
        unique_sets = {tuple(c.columns.keys()) for c in table.constraints if c.__class__.__name__ == "UniqueConstraint"}
        self.assertNotIn(("patient_id", "date"), unique_sets)
        ordinary = next(i for i in table.indexes if i.name == "uq_check_ins_ordinary_patient_date")
        self.assertTrue(ordinary.unique)
        self.assertEqual(list(ordinary.columns.keys()), ["patient_id", "date"])
        self.assertEqual(str(ordinary.dialect_options["postgresql"]["where"]), "self_harm_thoughts = false")
        self.assertIn(("patient_id", "id"), unique_sets)
        scoped = next(c for c in models.Alert.__table__.constraints if isinstance(c, ForeignKeyConstraint) and c.name == "fk_alerts_patient_check_in")
        self.assertEqual(list(scoped.column_keys), ["patient_id", "check_in_id"])
        self.assertEqual([e.target_fullname for e in scoped.elements], ["check_ins.patient_id", "check_ins.id"])
        for t in Base.metadata.tables.values():
            for fk in t.foreign_key_constraints:
                self.assertEqual(fk.ondelete, "RESTRICT")

    def test_new_consents_default_false_without_changing_existing_permissions(self):
        columns = models.PatientConsents.__table__.c
        for key in ["care_team_after_silence", "wearable"]:
            self.assertFalse(columns[key].nullable)
            self.assertIs(columns[key].default.arg, False)
            self.assertEqual(str(columns[key].server_default.arg), "false")
        for key in ["motion", "touch_pattern", "approximate_location", "vibration"]:
            self.assertIsNone(columns[key].server_default)

    def test_contract_enums_match_the_recorded_owais_snapshot(self):
        fixture = json.loads((ROOT / "tests/fixtures/owais_contract_v2.json").read_text(encoding="utf-8"))
        sensor = models.SensorAggregate.__table__
        for suffix, key in [("sensor_type", "sensor_types"), ("unit", "sensor_units"), ("source", "sensor_sources")]:
            constraint = next(c for c in sensor.constraints if c.name == "ck_sensor_aggregates_" + suffix)
            self.assertEqual(re.findall(r"'([^']*)'", str(constraint.sqltext)), fixture[key])
        kind = next(c for c in models.CheckIn.__table__.constraints if c.name == "ck_check_ins_kind")
        self.assertEqual(re.findall(r"'([^']*)'", str(kind.sqltext)), fixture["check_in_kinds"])
        self.assertNotIn("night_hrv", fixture["sensor_types"])
        self.assertNotIn("ms", fixture["sensor_units"])

    def test_sensor_interval_upsert_and_type_specific_checks(self):
        table = models.SensorAggregate.__table__
        unique_sets = {tuple(c.columns.keys()) for c in table.constraints if c.__class__.__name__ == "UniqueConstraint"}
        self.assertIn(("patient_id", "sensor_type", "period_start"), unique_sets)
        checks = {c.name: str(c.sqltext) for c in table.constraints if c.__class__.__name__ == "CheckConstraint"}
        self.assertEqual(checks["ck_sensor_aggregates_period_order"], "period_end > period_start")
        self.assertEqual(checks["ck_sensor_aggregates_nonnegative_value"], "value >= 0")
        self.assertEqual(checks["ck_sensor_aggregates_index_range"], "unit != 'index_0_1' OR value <= 1")
        self.assertEqual(checks["ck_sensor_aggregates_sleep_value_unit"], "sensor_type != 'sleep' OR (unit = 'hours' AND value <= 24)")
        self.assertEqual(checks["ck_sensor_aggregates_heart_value_unit"], "sensor_type != 'resting_heart_rate' OR (unit = 'bpm' AND value BETWEEN 20 AND 250)")
        for key in ["period_start", "period_end", "created_at", "updated_at"]:
            self.assertTrue(table.c[key].type.timezone)
            self.assertFalse(table.c[key].nullable)
        self.assertEqual(table.c.source.default.arg, "phone")
        self.assertFalse(any(key in table.c for key in ["night_hrv", "nightHrvMs", "latitude", "longitude", "payload"]))

    def test_alerts_allow_multiple_rows_for_same_check_in(self):
        table = models.Alert.__table__
        self.assertTrue(table.c.check_in_id.nullable)
        self.assertFalse(any(c.__class__.__name__ == "UniqueConstraint" for c in table.constraints))
        self.assertFalse(any(i.unique for i in table.indexes))

    def test_check_in_replacement_does_not_implicitly_regenerate_identity_or_time(self):
        table = models.CheckIn.__table__
        self.assertIsNone(table.c.id.onupdate)
        self.assertIsNone(table.c.created_at.onupdate)
        self.assertIsNone(table.c.created_at.server_onupdate)
        sql = str(update(models.CheckIn).where(models.CheckIn.id == "00000000-0000-4000-8000-000000000001").values(mood=4).compile(dialect=postgresql.dialect()))
        assignment = sql.split(" SET ")[1].split(" WHERE ")[0]
        self.assertNotIn("created_at", assignment)
        self.assertNotIn("id=", assignment)
        self.assertFalse(table.c.kind.nullable)
        self.assertEqual(table.c.kind.default.arg, "full")

    def test_types_timestamps_and_no_raw_or_plaintext_fields(self):
        dialect = postgresql.dialect()
        for table in Base.metadata.tables.values():
            for column in table.c:
                if column.name.endswith("_at"):
                    self.assertTrue(column.type.timezone, str(column))
        self.assertEqual(models.CheckIn.__table__.c.date.type.compile(dialect=dialect), "DATE")
        self.assertEqual(models.Alert.__table__.c.reasons.type.compile(dialect=dialect), "JSONB")
        self.assertIn("token_hash", models.AuthSession.__table__.c)
        self.assertNotIn("token", models.AuthSession.__table__.c)
        for table in Base.metadata.tables.values():
            self.assertFalse({"latitude", "longitude", "raw_samples", "conversation", "trusted_contact_phone"} & set(table.c.keys()))

    def test_frozen_migration_matches_metadata_without_a_database(self):
        revision = load_revision()
        frozen = MetaData()
        def create_table(name, *args, **kwargs):
            return Table(name, frozen, *args, **kwargs)
        def create_index(name, table_name, columns, **kwargs):
            kwargs.pop("schema", None)
            kwargs.pop("if_not_exists", None)
            Index(name, *(frozen.tables[table_name].c[c] for c in columns), **kwargs)
        with patch.object(revision.op, "f", side_effect=conv), patch.object(revision.op, "create_table", side_effect=create_table), patch.object(revision.op, "create_index", side_effect=create_index):
            revision.upgrade()
        self.assertEqual(set(frozen.tables), TABLES)
        dialect = postgresql.dialect()
        for name in TABLES:
            self.assertEqual(sorted(line.strip().rstrip(",") for line in str(CreateTable(frozen.tables[name]).compile(dialect=dialect)).splitlines()), sorted(line.strip().rstrip(",") for line in str(CreateTable(Base.metadata.tables[name]).compile(dialect=dialect)).splitlines()), name)
            actual = {str(CreateIndex(i).compile(dialect=dialect)) for i in frozen.tables[name].indexes}
            expected = {str(CreateIndex(i).compile(dialect=dialect)) for i in Base.metadata.tables[name].indexes}
            self.assertEqual(actual, expected, name)

    def test_offline_upgrade_and_downgrade_never_build_an_engine(self):
        output = io.StringIO()
        config = Config(str(ROOT / "alembic.ini"), output_buffer=output)
        with patch("sqlalchemy.create_engine", side_effect=AssertionError("No DB connection allowed")):
            command.upgrade(config, "head", sql=True)
        sql = output.getvalue()
        for name in TABLES:
            self.assertIn("CREATE TABLE " + name + " (", sql)
        self.assertIn("CREATE UNIQUE INDEX uq_check_ins_ordinary_patient_date ON check_ins (patient_id, date) WHERE self_harm_thoughts = false", sql)
        self.assertNotIn("UNIQUE (patient_id, date)", sql)
        self.assertIn("UNIQUE (patient_id, sensor_type, period_start)", sql)
        self.assertIn("CREATE TABLE public.alembic_version", sql)
        self.assertIn("FOREIGN KEY(patient_id, check_in_id) REFERENCES check_ins", sql)
        output.seek(0)
        output.truncate(0)
        with patch("sqlalchemy.create_engine", side_effect=AssertionError("No DB connection allowed")):
            command.downgrade(config, "20261114_0001:base", sql=True)
        self.assertEqual(output.getvalue().count("DROP TABLE ") - output.getvalue().count("DROP TABLE public.alembic_version"), 9)
        self.assertNotIn("CASCADE", output.getvalue())


class TransportTests(unittest.TestCase):
    def settings(self, **kwargs):
        return DatabaseSettings(host="127.0.0.1", name="fixture", user="fixture", password="fictitious-secret@:/%", sslmode="disable", sslrootcert=None, **kwargs)

    def test_canonical_dotenv_is_loaded_without_legacy_aliases(self):
        with tempfile.TemporaryDirectory() as directory:
            env = Path(directory) / ".env"
            env.write_text("HIILLOS_DB_HOST=127.0.0.1\nHIILLOS_DB_PORT=5432\nHIILLOS_DB_NAME=Hiillos\nHIILLOS_DB_USER=fixture\nHIILLOS_DB_PASSWORD=fictitious-secret\nHIILLOS_DB_SSLMODE=disable\n", encoding="utf-8")
            with patch.dict("os.environ", {}, clear=True):
                settings = DatabaseSettings(_env_file=env)
                self.assertEqual(settings.name, "Hiillos")
                self.assertEqual(settings.connect_args()["options"], "-c search_path=public")
                with patch.dict("os.environ", {"HIILLOS_DB_NAME": "override"}):
                    self.assertEqual(DatabaseSettings(_env_file=env).name, "override")
            env.write_text("DB_HOST=127.0.0.1\nDB_NAME=Hiillos\nDB_USER=fixture\nDB_PASSWORD=fictitious-secret\nDB_SSLMODE=disable\n", encoding="utf-8")
            with patch.dict("os.environ", {}, clear=True), self.assertRaises(ValidationError):
                DatabaseSettings(_env_file=env)
        self.assertEqual(TARGET_SCHEMA, "public")

    def test_url_handles_reserved_characters_and_masks_password(self):
        settings = self.settings()
        self.assertEqual(settings.url().password, "fictitious-secret@:/%")
        self.assertNotIn("fictitious-secret", str(settings.url()))
        self.assertNotIn("fictitious-secret", repr(settings))

    def test_remote_insecure_connection_is_rejected_without_secrets_in_error(self):
        with self.assertRaises(ValidationError) as raised:
            DatabaseSettings(host="remote.example.invalid", name="fixture", user="fixture", password="fictitious-secret", sslmode="disable")
        self.assertNotIn("fictitious-secret", str(raised.exception))

    def test_remote_tls_requires_existing_ca_file(self):
        with self.assertRaises(ValidationError):
            DatabaseSettings(host="remote.example.invalid", name="fixture", user="fixture", password="fixture", sslrootcert=None)
        with tempfile.TemporaryDirectory() as directory:
            ca = Path(directory) / "test-ca.pem"
            ca.write_text("fixture file, not a trusted CA", encoding="utf-8")
            settings = DatabaseSettings(host="remote.example.invalid", name="fixture", user="fixture", password="fixture", sslrootcert=ca)
            self.assertEqual(settings.connect_args()["sslmode"], "verify-full")
            self.assertEqual(settings.connect_args()["sslrootcert"], str(ca.resolve()))
            # This checks configuration only; no handshake or network is attempted.

    def test_engine_factory_is_lazy_and_does_not_connect(self):
        from app.db.session import build_engine
        with patch("psycopg.connect", side_effect=AssertionError("No network allowed")):
            engine = build_engine(self.settings())
            self.assertTrue(engine.hide_parameters)
            engine.dispose()


if __name__ == "__main__":
    unittest.main()
