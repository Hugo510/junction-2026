from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Values come from environment variables (GEMINI_API_KEY, ELEVENLABS_API_KEY, ...).

    Keys are NEVER committed: locally they live in an ignored .env, on Modal in a Secret.
    Without a key the matching feature answers 503 and the app falls back to its
    built-in companion, so the demo never depends on these services.
    """

    app_version: str = "0.1.0"
    demo_mode: bool = True

    # LLM companion (opt-in in the app)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.8-flash"

    # Voice for the companion's own messages
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "JBFqnCBsd6RMkjVDRZzb"
    elevenlabs_model: str = "eleven_multilingual_v2"

    # Comma-separated list of allowed origins for browsers ("*" for the demo).
    cors_origins: str = "*"


settings = Settings()
