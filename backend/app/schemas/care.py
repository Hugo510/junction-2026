from datetime import datetime
from typing import Literal
from uuid import UUID

from app.schemas.common import CamelModel, Reason


class CrisisResource(CamelModel):
    id: str
    name_key: str
    phone: str
    available: str
    url: str | None = None
    verified: bool = False  # keep False until a mentor has checked the number


class Alert(CamelModel):
    id: UUID
    patient_id: str
    patient_display_name: str
    type: Literal["urgent_risk", "deterioration", "missed_checkins"]
    severity: Literal["info", "warning", "urgent"]
    reasons: list[Reason]
    created_at: datetime
    acknowledged_at: datetime | None = None
    acknowledged_by: str | None = None