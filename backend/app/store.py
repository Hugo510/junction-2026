from datetime import datetime, timezone

from datetime import date as CalendarDate
from app.schemas.care import Alert
from app.schemas.checkin import CheckIn

from app.schemas.sensors import SensorAggregate, SensorType

from app.schemas.patient import (
    AppSettings,
    Companion,
    CompanionSpecies,
    Consents,
    Language,
    Patient,
)

# user id -> list of check-ins (several per day are allowed)
CHECKINS: dict[str, list[CheckIn]] = {}

# urgent alerts for the care team (filled by the self-harm rule)
ALERTS: list[Alert] = []

PATIENT_ID = "11111111-1111-4111-8111-111111111111"
DOCTOR_ID = "22222222-2222-4222-8222-222222222222"

# patient user id -> patient profile (in memory for now)
PATIENTS: dict[str, Patient] = {
    PATIENT_ID: Patient(
        id=PATIENT_ID,
        display_name="Aino (synthetic)",
        language=Language.en,
        time_zone="Europe/Helsinki",
        companion=Companion(species=CompanionSpecies.cat, name="Pip"),
        consents=Consents(
            motion=False,
            touch_pattern=False,
            approximate_location=False,
            vibration=False,
        ),
        settings=AppSettings(),
        care_team_ids=[DOCTOR_ID],
        created_at=datetime(2026, 11, 1, 9, 0, tzinfo=timezone.utc),
    ),
}

# user id -> {(sensor type, period start) -> aggregate}. Upserted on that key.
SENSOR_AGGREGATES: dict[str, dict[tuple[SensorType, datetime], SensorAggregate]] = {}