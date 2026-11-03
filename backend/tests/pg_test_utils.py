"""Shared helpers for PostgreSQL-backed tests.

SAFETY (read before touching this file): PostgreSQL-backed tests must
NEVER connect to `settings.database_url` — that is the application's
runtime connection string, and on a shared or multi-project machine
something entirely unrelated can be listening on its host/port with
credentials that happen to satisfy it. That is exactly what happened once
in this project's history: an unrelated project's PostgreSQL container
(`accident_db`) was occupying the default port, this project's default
DATABASE_URL credentials happened to authenticate against it, and this
suite's fixtures silently connected and ran CREATE DATABASE/DROP
DATABASE/DELETE against it instead of skipping.

The fix is structural, not "be more careful": PostgreSQL-backed tests only
ever use `settings.test_database_url` (from the TEST_DATABASE_URL
environment variable), which has no default, and they skip — never fall
back — when it is unset. See test_postgres_test_safety.py for tests that
enforce this directly.
"""

from __future__ import annotations

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import OperationalError

from app.config import settings


def get_test_database_url() -> str | None:
    """The explicitly configured TEST_DATABASE_URL, or None.

    Deliberately never reads settings.database_url — see module docstring.
    """
    return settings.test_database_url or None


def postgres_test_engine_or_skip() -> Engine:
    """
    Return a live engine connected to TEST_DATABASE_URL, or call
    pytest.skip() with a clear reason.

    Skips WITHOUT attempting any connection at all if TEST_DATABASE_URL is
    unset — this function never even constructs an engine in that case, so
    "TEST_DATABASE_URL not configured" can never accidentally degrade into
    a connection attempt against some other database.
    """
    test_url = get_test_database_url()
    if not test_url:
        pytest.skip(
            "TEST_DATABASE_URL is not configured. PostgreSQL-backed tests "
            "require a dedicated, explicitly-configured test database and "
            "refuse to fall back to DATABASE_URL (the application's runtime "
            "database) — set TEST_DATABASE_URL to run these tests. "
            "See .env.example."
        )

    try:
        engine = create_engine(test_url, connect_args={"connect_timeout": 2})
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return engine
    except OperationalError:
        pytest.skip(f"TEST_DATABASE_URL is set but not reachable: {test_url!r}")
    except Exception:
        pytest.skip(
            f"TEST_DATABASE_URL is set but a connection could not be established: {test_url!r}"
        )
