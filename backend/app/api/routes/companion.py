from fastapi import APIRouter, Depends, HTTPException

from app.api.routes.auth import get_current_user
from app.config import settings
from app.schemas.companion import (
    CompanionReply,
    CompanionReplyRequest,
    CompanionStatus,
    SpeechRequest,
    SpeechResponse,
)
from app.services.companion import CompanionUnavailable, generate_reply, has_crisis_language
from app.services.speech import SpeechUnavailable, synthesize

router = APIRouter(prefix="/companion", tags=["companion"])


@router.get("/status", response_model=CompanionStatus)
def companion_status():
    """Which optional features are configured on this server (no secrets are exposed)."""
    return CompanionStatus(llm=bool(settings.gemini_api_key), voice=bool(settings.elevenlabs_api_key))


@router.post("/reply", response_model=CompanionReply)
async def companion_reply(body: CompanionReplyRequest, user: dict = Depends(get_current_user)):
    # Fixed rule first: crisis language never reaches the model.
    if has_crisis_language(body.message):
        return CompanionReply(reply=None, source="safety", crisis=True)

    try:
        text = await generate_reply(body)
    except CompanionUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return CompanionReply(reply=text, source="llm")


@router.post("/speech", response_model=SpeechResponse)
async def companion_speech(body: SpeechRequest, user: dict = Depends(get_current_user)):
    # The companion never reads crisis wording aloud; the crisis screen handles that.
    if has_crisis_language(body.text):
        raise HTTPException(status_code=422, detail="This text is not read aloud")

    try:
        audio = await synthesize(body.text, body.companion)
    except SpeechUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return SpeechResponse(audio_base64=audio)
