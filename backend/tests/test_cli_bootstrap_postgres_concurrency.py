"""PostgreSQL-specific concurrency test for app.cli.bootstrap_admin().

This test exercises the actual advisory-lock protection described in
bootstrap_admin()'s docstring — something the in-memory SQLite fixture used
by the rest of this suite cannot do, since SQLite has no advisory-lock
mechanism (see test_acquire_bootstrap_lock_is_a_noop_on_sqlite in
test_cli_bootstrap.py, which documents that gap explicitly).

WHY THIS MAY NOT RUN LOCALLY:
This test requires a dedicated, explicitly-configured TEST_DATABASE_URL
(see tests/pg_test_utils.py) and refuses to fall back to DATABASE_URL, the
application's own runtime connection string — connecting a test suite that
creates/deletes rows to whatever happens to be listening on DATABASE_URL's
host/port is exactly the kind of accident this split exists to prevent.
Skips, with a clear reason, if TEST_DATABASE_URL is not set or not
reachable, rather than failing the suite or silently using another database.
"""

import threading

import pytest
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401  ensure all models are registered
from app.cli import BootstrapRefused, bootstrap_admin
from app.models.user import User
from tests.pg_test_utils import postgres_test_engine_or_skip


@pytest.fixture(scope="module")
def postgres_engine():
    engine = postgres_test_engine_or_skip()
    yield engine
    engine.dispose()


@pytest.fixture()
def postgres_sessionmaker(postgres_engine):
    User.__table__.create(bind=postgres_engine, checkfirst=True)
    factory = sessionmaker(bind=postgres_engine)

    cleanup = factory()
    cleanup.query(User).delete()
    cleanup.commit()
    cleanup.close()

    yield factory

    cleanup = factory()
    cleanup.query(User).delete()
    cleanup.commit()
    cleanup.close()


def test_concurrent_bootstrap_attempts_create_exactly_one_user(postgres_sessionmaker):
    """
    Two bootstrap_admin() calls, started as close to simultaneously as
    possible against a real PostgreSQL database using two independent
    sessions/connections, must result in exactly one success and one clean
    BootstrapRefused — never two users, regardless of which specific
    refusal reason (lock contention vs. post-lock existence check) fires.
    """
    results: dict[str, tuple[str, str]] = {}
    barrier = threading.Barrier(2)

    def attempt(key: str, email: str) -> None:
        db = postgres_sessionmaker()
        try:
            barrier.wait(timeout=5)
            try:
                user = bootstrap_admin(
                    db, name="Admin", email=email, password="a-strong-password"
                )
                results[key] = ("success", user.email)
            except BootstrapRefused as exc:
                results[key] = ("refused", str(exc))
        finally:
            db.close()

    t1 = threading.Thread(target=attempt, args=("t1", "admin1@example.com"))
    t2 = threading.Thread(target=attempt, args=("t2", "admin2@example.com"))
    t1.start()
    t2.start()
    t1.join(timeout=10)
    t2.join(timeout=10)

    assert set(results.keys()) == {"t1", "t2"}
    outcomes = [results["t1"][0], results["t2"][0]]
    assert outcomes.count("success") == 1, f"expected exactly one success, got {results}"
    assert outcomes.count("refused") == 1, f"expected exactly one refusal, got {results}"

    verify_db = postgres_sessionmaker()
    try:
        assert verify_db.query(User).count() == 1
    finally:
        verify_db.close()
