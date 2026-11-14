"""Database settings are separate from app.config: no startup/route changes."""
from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL


BACKEND_ROOT = Path(__file__).resolve().parents[2]
TARGET_SCHEMA = "public"


class DatabaseSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="HIILLOS_DB_", env_file=BACKEND_ROOT / ".env",
        env_file_encoding="utf-8", extra="ignore", hide_input_in_errors=True,
    )
    host: str
    port: int = Field(default=5432, ge=1, le=65535)
    name: str
    user: str
    password: SecretStr
    sslmode: Literal["verify-full", "disable"] = "verify-full"
    sslrootcert: Path | None = None
    connect_timeout: int = Field(default=10, ge=1)

    @model_validator(mode="after")
    def safe_transport(self):
        if self.sslrootcert is not None and not self.sslrootcert.is_absolute():
            self.sslrootcert = (BACKEND_ROOT / self.sslrootcert).resolve()
        if self.sslmode == "disable" and self.host not in {"localhost", "127.0.0.1", "::1"}:
            raise ValueError("TLS can only be disabled for an explicit loopback test host")
        if self.sslmode == "verify-full" and (self.sslrootcert is None or not self.sslrootcert.is_file()):
            raise ValueError("verify-full requires an existing HIILLOS_DB_SSLROOTCERT CA file")
        return self

    def url(self) -> URL:
        # URL.create handles reserved password characters without hand-built URLs.
        return URL.create("postgresql+psycopg", username=self.user,
                          password=self.password.get_secret_value(), host=self.host,
                          port=self.port, database=self.name)

    def connect_args(self) -> dict:
        args = {"sslmode": self.sslmode, "connect_timeout": self.connect_timeout,
                "options": "-c search_path=public"}
        if self.sslrootcert is not None:
            args["sslrootcert"] = str(self.sslrootcert.resolve())
        return args
