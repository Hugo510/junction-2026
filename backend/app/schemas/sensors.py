from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import ConfigDict, Field, model_validator

from app.schemas.common import CamelModel


class SensorType(str, Enum):
    activity = "activity"
    steps = "steps"
    outdoor_daylight = "outdoor_daylight"
    screen_engagement = "screen_engagement"


class SensorAggregate(CamelModel):
    # Reject unknown fields, so raw signals or coordinates can't slip in unnoticed
    model_config = ConfigDict(extra="forbid")

    type: SensorType
    period_start: datetime
    period_end: datetime
    value: float
    unit: Literal["minutes", "steps", "index_0_1", "count"]
    source: Literal["phone", "wearable", "manual", "synthetic"] = "phone"

    @model_validator(mode="after")
    def check_period_and_value(self):
        if self.period_end <= self.period_start:
            raise ValueError("periodEnd must be after periodStart")
        if self.value < 0:
            raise ValueError("value cannot be negative")
        if self.unit == "index_0_1" and self.value > 1:
            raise ValueError("index_0_1 values must be between 0 and 1")
        return self


class SensorBatch(CamelModel):
    items: list[SensorAggregate] = Field(min_length=1, max_length=200)