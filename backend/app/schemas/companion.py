from typing import Literal

from pydantic import Field

from app.schemas.common import CamelModel
from app.schemas.patient import Language


class CompanionTurn(CamelModel):
    role: Literal["user", "companion"]
    text: str = Field(min_length=1, max_length=1000)


class CompanionReplyRequest(CamelModel):
    """One message typed by the person, plus a little context. No health data is sent."""

    message: str = Field(min_length=1, max_length=1000)
    language: Language = Language.en
    companion_name: str = Field(default="Hiillos", min_length=1, max_length=30)
    # Last few turns only, so the reply fits the conversation.
    history: list[CompanionTurn] = Field(default_factory=list, max_length=8)


class CompanionReply(CamelModel):
    # None when the safety rule answered instead of the model.
    reply: str | None = None
    source: Literal["llm", "safety"]
    # True = the app must open the crisis screen. Decided by a fixed rule, never by the model.
    crisis: bool = False


class SpeechRequest(CamelModel):
    """Text the COMPANION said (never what the person typed)."""

    text: str = Field(min_length=1, max_length=600)
    language: Language = Language.en
    # Which companion is speaking ("cat", "dog", ...), so each can have its own voice.
    companion: str | None = Field(default=None, max_length=20)


class SpeechResponse(CamelModel):
    audio_base64: str
    mime_type: str = "audio/mpeg"


class CompanionStatus(CamelModel):
    llm: bool
    voice: bool
