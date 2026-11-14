from datetime import datetime
from enum import Enum
from typing import Literal
from uuid import UUID

from pydantic import Field

from app.schemas.common import CamelModel


class Language(str, Enum):
    en = "en"
    fi = "fi"
    es = "es"
    sv = "sv"


class CompanionSpecies(str, Enum):
    bee = "bee"
    cat = "cat"
    dog = "dog"
    bird = "bird"
    human = "human"


class Companion(CamelModel):
    species: CompanionSpecies
    name: str = Field(min_length=1, max_length=30)


class AppSettings(CamelModel):
    theme: Literal["system", "light", "dark"] = "system"
    large_text: bool = False
    reduce_motion: bool = False
    haptics: bool = True


class Consents(CamelModel):
    motion: bool
    touch_pattern: bool
    approximate_location: bool
    vibration: bool
    updated_at: datetime | None = None


class Patient(CamelModel):
    id: UUID
    display_name: str
    language: Language
    time_zone: str
    companion: Companion
    consents: Consents
    settings: AppSettings
    care_team_ids: list[UUID] = []
    created_at: datetime