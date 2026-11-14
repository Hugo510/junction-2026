from datetime import date as CalendarDate, datetime
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import Field

from app.schemas.care import CrisisResource
from app.schemas.common import CamelModel, Reason


class ReactionGameResult(CamelModel):
    rounds: int = Field(ge=1)
    mean_ms: float
    sd_ms: float
    accuracy: float = Field(ge=0, le=1)


class Safety(CamelModel):
    self_harm_thoughts: bool


class CheckInKind(str, Enum):
    full = "full"
    chat = "chat"
    journal = "journal"


class CheckInCreate(CamelModel):
    date: CalendarDate
    mood: int = Field(ge=1, le=5)
    energy: int | None = Field(default=None, ge=1, le=5)
    anxiety: int | None = Field(default=None, ge=1, le=5)
    sleep_hours: float | None = Field(default=None, ge=0, le=24)
    note: str | None = Field(default=None, max_length=1000)
    emotions: list[str] | None = Field(default=None, max_length=20)
    kind: CheckInKind = CheckInKind.full
    body_map: dict[str, Any] | None = None
    reaction_game: ReactionGameResult | None = None
    safety: Safety


class CheckIn(CheckInCreate):
    id: UUID
    created_at: datetime


class RiskLevel(str, Enum):
    none = "none"
    watch = "watch"
    urgent = "urgent"


class PriorityLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class Priority(CamelModel):
    score: int = Field(ge=0, le=100)
    level: PriorityLevel
    reasons: list[Reason]
    computed_at: datetime


class Risk(CamelModel):
    level: RiskLevel
    alert_id: UUID | None = None


class CheckInResult(CamelModel):
    check_in: CheckIn
    priority: Priority
    risk: Risk
    crisis_resources: list[CrisisResource] | None = None
    suggest_consultation: bool = False