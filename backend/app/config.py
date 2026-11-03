from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration, populated from environment variables / .env file."""

    app_name: str = "WareSphere API"
    app_env: str = "development"

    # SQLAlchemy-style connection string, e.g.:
    # postgresql+psycopg2://user:password@host:port/database
    database_url: str = (
        "postgresql+psycopg2://waresphere_user:waresphere_password@localhost:5432/waresphere"
    )

    # A separate, explicitly-configured connection string for PostgreSQL-
    # backed tests (tests/test_*postgres*.py). NO default, and tests must
    # NEVER fall back to database_url above: on a shared/dev machine,
    # something unrelated can be listening on database_url's host/port with
    # credentials that happen to satisfy it, and a test suite that creates
    # databases, runs migrations, and deletes rows has no business finding
    # that out the hard way. See tests/pg_test_utils.py.
    test_database_url: Optional[str] = None

    # JWT settings. jwt_secret_key deliberately has NO real default (empty
    # string) — a hardcoded secret checked into source would defeat the
    # point of signing tokens. app.security raises a clear RuntimeError the
    # first time a token is issued/verified if this is left unset, rather
    # than failing at import time for every module that transitively
    # imports app.config (most of the codebase, including tests that never
    # touch authentication at all). See .env.example for how to set it.
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 14

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
