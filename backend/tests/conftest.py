"""Shared pytest fixtures.

Tests use a fresh in-memory SQLite database per test, not the real
PostgreSQL configured via DATABASE_URL — this project has never connected
to a real Postgres instance, and Phase 0 explicitly excludes migrations.
SQLAlchemy's postgresql.UUID type has been verified (manually, before
writing these fixtures) to fall back gracefully when compiled for SQLite,
so this still exercises real inserts/queries/constraints, not mocks.
"""

import os

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# Required before app.config.Settings is first instantiated (a module-level
# singleton, constructed on the first `import app.config` — which most of
# this codebase triggers transitively, including tests that never touch
# authentication at all). setdefault() so a real environment-provided
# secret, if one is set, always takes precedence over this fixed,
# test-only value.
os.environ.setdefault("JWT_SECRET_KEY", "test-only-secret-not-for-production-use")

from app.database import Base

# Importing app.models registers every model on Base.metadata, required
# before create_all() can build all tables.
import app.models  # noqa: F401


@pytest.fixture()
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine)
    session: Session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()
