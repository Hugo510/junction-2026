"""Persistence schema only. No route/store is switched to these models yet.

V2 source contracts: origin/owais/backend at f5d5698, patient/checkin/care/sensors.
The local HTTP code stays on the branch base; this module does not import it.
No clinical rules are computed in SQL. All deletes are restricted, not cascaded.
"""
from datetime import date as CalendarDate, datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean, CheckConstraint, Date, DateTime, Double, ForeignKey,
    ForeignKeyConstraint, Index, Integer, LargeBinary, Text,
    UniqueConstraint, Uuid, func, text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (CheckConstraint("role IN ('patient', 'doctor')", name="role"),)
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    role: Mapped[str] = mapped_column(Text)
    is_synthetic: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Patient(Base):
    __tablename__ = "patients"
    __table_args__ = (
        CheckConstraint("language IN ('en', 'fi', 'es', 'sv')", name="language"),
        CheckConstraint("companion_species IN ('bee', 'cat', 'dog', 'bird', 'human')", name="companion_species"),
        CheckConstraint("char_length(companion_name) BETWEEN 1 AND 30", name="companion_name_length"),
        CheckConstraint("theme IN ('system', 'light', 'dark')", name="theme"),
    )
    # Same identity as the user, matching PATIENTS and GET /me.
    id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), primary_key=True)
    display_name: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(Text)
    time_zone: Mapped[str] = mapped_column(Text)
    companion_species: Mapped[str] = mapped_column(Text)
    companion_name: Mapped[str] = mapped_column(Text)
    theme: Mapped[str] = mapped_column(Text, server_default=text("'system'"))
    large_text: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    reduce_motion: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    haptics: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    user: Mapped[User] = relationship()


class Professional(Base):
    __tablename__ = "professionals"
    id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), primary_key=True)
    user: Mapped[User] = relationship()


class PatientCareTeam(Base):
    __tablename__ = "patient_care_team"
    __table_args__ = (Index("ix_patient_care_team_professional_patient", "professional_id", "patient_id"),)
    patient_id: Mapped[UUID] = mapped_column(ForeignKey("patients.id", ondelete="RESTRICT"), primary_key=True)
    professional_id: Mapped[UUID] = mapped_column(ForeignKey("professionals.id", ondelete="RESTRICT"), primary_key=True)
    patient: Mapped[Patient] = relationship()
    professional: Mapped[Professional] = relationship()


class PatientConsents(Base):
    __tablename__ = "patient_consents"
    patient_id: Mapped[UUID] = mapped_column(ForeignKey("patients.id", ondelete="RESTRICT"), primary_key=True)
    # No implied consent: caller must explicitly supply all four flags.
    motion: Mapped[bool] = mapped_column(Boolean)
    touch_pattern: Mapped[bool] = mapped_column(Boolean)
    approximate_location: Mapped[bool] = mapped_column(Boolean)
    vibration: Mapped[bool] = mapped_column(Boolean)
    care_team_after_silence: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))
    wearable: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    patient: Mapped[Patient] = relationship()


class AuthSession(Base):
    __tablename__ = "auth_sessions"
    __table_args__ = (
        CheckConstraint("octet_length(token_hash) = 32", name="sha256_length"),
        UniqueConstraint("token_hash", name="uq_auth_sessions_token_hash"),
        Index("ix_auth_sessions_user_created", "user_id", "created_at"),
        Index("ix_auth_sessions_expires_at", "expires_at"),
    )
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    # SHA-256 digest of the existing high-entropy opaque token, not a password hash.
    token_hash: Mapped[bytes] = mapped_column(LargeBinary)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    user: Mapped[User] = relationship()


class CheckIn(Base):
    __tablename__ = "check_ins"
    __table_args__ = (
        Index("uq_check_ins_ordinary_patient_date", "patient_id", "date",
              unique=True, postgresql_where=text("self_harm_thoughts = false")),
        Index("ix_check_ins_patient_date_created", "patient_id", "date", "created_at"),
        CheckConstraint("kind IN ('full', 'chat', 'journal')", name="kind"),
        # Candidate key for the alert's patient-scoped composite FK.
        UniqueConstraint("patient_id", "id", name="uq_check_ins_patient_id"),
        CheckConstraint("mood BETWEEN 1 AND 5", name="mood_range"),
        CheckConstraint("energy IS NULL OR energy BETWEEN 1 AND 5", name="energy_range"),
        CheckConstraint("anxiety IS NULL OR anxiety BETWEEN 1 AND 5", name="anxiety_range"),
        CheckConstraint("sleep_hours IS NULL OR sleep_hours BETWEEN 0 AND 24", name="sleep_range"),
        CheckConstraint("note IS NULL OR char_length(note) <= 1000", name="note_length"),
        CheckConstraint(
            "(reaction_rounds IS NULL AND reaction_mean_ms IS NULL AND reaction_sd_ms IS NULL AND reaction_accuracy IS NULL) OR "
            "(reaction_rounds IS NOT NULL AND reaction_mean_ms IS NOT NULL AND reaction_sd_ms IS NOT NULL AND reaction_accuracy IS NOT NULL)",
            name="reaction_presence",
        ),
        CheckConstraint("reaction_rounds IS NULL OR reaction_rounds >= 1", name="reaction_rounds"),
        CheckConstraint("reaction_accuracy IS NULL OR reaction_accuracy BETWEEN 0 AND 1", name="reaction_accuracy"),
        # The full non-unique index includes safety reports, unlike the partial unique index.
    )
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    patient_id: Mapped[UUID] = mapped_column(ForeignKey("patients.id", ondelete="RESTRICT"))
    date: Mapped[CalendarDate] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    mood: Mapped[int] = mapped_column(Integer)
    kind: Mapped[str] = mapped_column(Text, default="full", server_default=text("'full'"))
    energy: Mapped[int | None] = mapped_column(Integer)
    anxiety: Mapped[int | None] = mapped_column(Integer)
    sleep_hours: Mapped[float | None] = mapped_column(Double)
    # Column prepared for the existing API; actual cloud persistence is pending approval.
    note: Mapped[str | None] = mapped_column(Text)
    reaction_rounds: Mapped[int | None] = mapped_column(Integer)
    reaction_mean_ms: Mapped[float | None] = mapped_column(Double)
    reaction_sd_ms: Mapped[float | None] = mapped_column(Double)
    reaction_accuracy: Mapped[float | None] = mapped_column(Double)
    self_harm_thoughts: Mapped[bool] = mapped_column(Boolean)
    patient: Mapped[Patient] = relationship()


class Alert(Base):
    __tablename__ = "alerts"
    __table_args__ = (
        CheckConstraint("type IN ('urgent_risk', 'deterioration', 'missed_checkins')", name="type"),
        CheckConstraint("severity IN ('info', 'warning', 'urgent')", name="severity"),
        CheckConstraint("jsonb_typeof(reasons) = 'array'", name="reasons_array"),
        ForeignKeyConstraint(
            ["patient_id", "check_in_id"], ["check_ins.patient_id", "check_ins.id"],
            name="fk_alerts_patient_check_in", ondelete="RESTRICT",
        ),
        Index("ix_alerts_patient_created", "patient_id", "created_at"),
        Index("ix_alerts_check_in", "patient_id", "check_in_id"),
        Index("ix_alerts_acknowledged_by", "acknowledged_by"),
        Index("ix_alerts_open_created", "created_at", postgresql_where=text("acknowledged_at IS NULL")),
    )
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    patient_id: Mapped[UUID] = mapped_column(ForeignKey("patients.id", ondelete="RESTRICT"))
    check_in_id: Mapped[UUID | None] = mapped_column(Uuid)
    # Snapshot, not a live join: a later profile rename must not rewrite the alert.
    patient_display_name: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(Text)
    reasons: Mapped[list[dict]] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    acknowledged_by: Mapped[UUID | None] = mapped_column(ForeignKey("professionals.id", ondelete="RESTRICT"))
    patient: Mapped[Patient] = relationship(foreign_keys=[patient_id])
    acknowledged_professional: Mapped[Professional | None] = relationship(foreign_keys=[acknowledged_by])


class SensorAggregate(Base):
    """One scalar metric per interval, not raw measurements or fixed calendar days.

    Wire `type` maps to sensor_type. No HRV type or generic JSON payload.
    Consent and atomic batch upserts remain service/repository responsibilities.
    """
    __tablename__ = "sensor_aggregates"
    __table_args__ = (
        UniqueConstraint("patient_id", "sensor_type", "period_start", name="uq_sensor_aggregates_patient_type_start"),
        CheckConstraint("sensor_type IN ('activity', 'steps', 'outdoor_daylight', 'screen_engagement', 'sleep', 'resting_heart_rate')", name="sensor_type"),
        CheckConstraint("unit IN ('minutes', 'steps', 'index_0_1', 'count', 'hours', 'bpm')", name="unit"),
        CheckConstraint("source IN ('phone', 'wearable', 'manual', 'synthetic')", name="source"),
        CheckConstraint("period_end > period_start", name="period_order"),
        CheckConstraint("value >= 0", name="nonnegative_value"),
        CheckConstraint("unit != 'index_0_1' OR value <= 1", name="index_range"),
        CheckConstraint("sensor_type != 'sleep' OR (unit = 'hours' AND value <= 24)", name="sleep_value_unit"),
        CheckConstraint("sensor_type != 'resting_heart_rate' OR (unit = 'bpm' AND value BETWEEN 20 AND 250)", name="heart_value_unit"),
        Index("ix_sensor_aggregates_patient_period", "patient_id", "period_start"),
    )
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    patient_id: Mapped[UUID] = mapped_column(ForeignKey("patients.id", ondelete="RESTRICT"))
    sensor_type: Mapped[str] = mapped_column(Text)
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    value: Mapped[float] = mapped_column(Double)
    unit: Mapped[str] = mapped_column(Text)
    source: Mapped[str] = mapped_column(Text, default="phone", server_default=text("'phone'"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # A future upsert must explicitly update this timestamp, preserving id/created_at.
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    patient: Mapped[Patient] = relationship()
