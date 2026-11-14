from app.schemas.patient import Consents
from app.schemas.sensors import SensorAggregate, SensorType

# Which consent flag each sensor type needs
CONSENT_FOR_SENSOR: dict[SensorType, str] = {
    SensorType.activity: "motion",
    SensorType.steps: "motion",
    SensorType.outdoor_daylight: "approximate_location",
    SensorType.screen_engagement: "touch_pattern",
    SensorType.sleep: "wearable",
    SensorType.resting_heart_rate: "wearable",
}


def find_unconsented_types(items: list[SensorAggregate], consents: Consents) -> list[str]:
    """Return the sensor types in the batch that the patient hasn't consented to."""
    missing = {
        item.type.value
        for item in items
        if not getattr(consents, CONSENT_FOR_SENSOR[item.type])
    }
    return sorted(missing)