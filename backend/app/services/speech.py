"""Text to speech for the companion's own messages (ElevenLabs).

Only text written by the companion is ever sent here: the app never sends what the
person typed. The key stays on the server.
"""

import base64

import httpx

from app.config import settings

TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"


class SpeechUnavailable(Exception):
    """No key configured, or the voice service did not answer."""


async def synthesize(text: str) -> str:
    """Returns MP3 audio as base64."""
    if not settings.elevenlabs_api_key:
        raise SpeechUnavailable("Voice is not configured")

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            res = await client.post(
                TTS_URL.format(voice_id=settings.elevenlabs_voice_id),
                params={"output_format": "mp3_44100_128"},
                headers={"xi-api-key": settings.elevenlabs_api_key, "Content-Type": "application/json"},
                json={"text": text, "model_id": settings.elevenlabs_model},
            )
        res.raise_for_status()
    except httpx.HTTPError as exc:
        raise SpeechUnavailable("The voice service did not answer") from exc

    if not res.content:
        raise SpeechUnavailable("The voice service returned no audio")
    return base64.b64encode(res.content).decode("ascii")
