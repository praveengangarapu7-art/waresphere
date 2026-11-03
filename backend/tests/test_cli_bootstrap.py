"""Tests for app.cli.bootstrap_admin.

These test the pure bootstrap_admin(db, ...) function directly against a
real (in-memory SQLite) session — not the interactive/env-var-reading CLI
wrapper, which contains only I/O and no logic worth testing beyond a manual
smoke check.
"""

import pytest
from sqlalchemy.exc import IntegrityError

from app.cli import BOOTSTRAP_ADMIN_ROLE, BootstrapRefused, _acquire_bootstrap_lock, bootstrap_admin
from app.models.user import User
from app.security import validate_and_normalize_email, verify_password


def test_bootstrap_creates_exactly_one_it_admin_account(db_session):
    user = bootstrap_admin(
        db_session, name="Admin", email="admin@example.com", password="a-strong-password"
    )

    assert user.role == BOOTSTRAP_ADMIN_ROLE == "it_admin"
    assert user.is_active is True
    assert db_session.query(User).count() == 1


def test_bootstrap_refuses_when_a_user_already_exists(db_session):
    existing = User(
        name="Existing User",
        email="existing@example.com",
        password_hash="irrelevant-hash",
        role="staff",
    )
    db_session.add(existing)
    db_session.commit()

    with pytest.raises(BootstrapRefused, match="at least one user already exists"):
        bootstrap_admin(
            db_session, name="Admin", email="admin@example.com", password="a-strong-password"
        )

    # Refusal must not have created a second row.
    assert db_session.query(User).count() == 1


def test_bootstrap_never_stores_the_plaintext_password(db_session):
    plaintext = "a-strong-password"
    user = bootstrap_admin(db_session, name="Admin", email="admin@example.com", password=plaintext)

    stored = db_session.query(User).filter(User.id == user.id).one()
    assert stored.password_hash != plaintext
    assert plaintext not in stored.password_hash
    assert stored.password_hash.startswith("$argon2id$")
    assert verify_password(plaintext, stored.password_hash) is True


def test_bootstrap_rejects_short_password(db_session):
    with pytest.raises(BootstrapRefused, match="at least 8 characters"):
        bootstrap_admin(db_session, name="Admin", email="admin@example.com", password="short")

    assert db_session.query(User).count() == 0


def test_bootstrap_rejects_invalid_email(db_session):
    with pytest.raises(BootstrapRefused, match="invalid email address"):
        bootstrap_admin(
            db_session, name="Admin", email="not-an-email", password="a-strong-password"
        )

    assert db_session.query(User).count() == 0


def test_bootstrap_normalizes_email_case_and_domain(db_session):
    """
    email-validator normalizes the domain (and IDNA-encodes it) but does
    NOT lowercase the local part by default — bootstrap_admin() must
    additionally lowercase the full normalized address so the existing
    case-sensitive `users.email` UNIQUE constraint behaves the way users
    expect (Admin@X.com and admin@x.com are the same account).
    """
    user = bootstrap_admin(
        db_session, name="Admin", email="Admin@Example.COM", password="a-strong-password"
    )
    assert user.email == "admin@example.com"


@pytest.mark.parametrize(
    "email",
    [
        "admin@example.com",
        "first.last+tag@example.co.uk",
        "Admin@Example.COM",
        "user@sub.example.com",
    ],
)
def test_validate_and_normalize_email_accepts_valid_formats(email):
    normalized = validate_and_normalize_email(email)
    assert "@" in normalized
    assert normalized == normalized.lower()


@pytest.mark.parametrize(
    "email",
    [
        "not-an-email",
        "missing-domain@",
        "@missing-local.com",
        "no-at-sign.example.com",
        "spaces in@example.com",
        "",
    ],
)
def test_validate_and_normalize_email_rejects_malformed_formats(email):
    with pytest.raises(ValueError, match="invalid email address"):
        validate_and_normalize_email(email)


def test_acquire_bootstrap_lock_is_a_noop_on_sqlite(db_session):
    """
    Documents and verifies the known limitation: the advisory-lock
    concurrency protection is PostgreSQL-specific. Against SQLite (used
    only by this test suite) it must not raise — it simply returns True
    unconditionally, since SQLite has no advisory-lock mechanism to call.
    """
    assert db_session.bind.dialect.name == "sqlite"
    assert _acquire_bootstrap_lock(db_session) is True


def test_duplicate_email_is_rejected_by_the_database_constraint_and_rolled_back(db_session):
    """
    Defense-in-depth check: even if the application-level "any user exists"
    guard were ever bypassed, the users.email UNIQUE constraint must still
    prevent a duplicate row, and the failed transaction must roll back
    cleanly rather than leaving the session in a broken state.
    """
    first = User(name="First", email="dup@example.com", password_hash="hash-one", role="staff")
    db_session.add(first)
    db_session.commit()

    second = User(name="Second", email="dup@example.com", password_hash="hash-two", role="staff")
    db_session.add(second)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    # Session must still be usable after rollback, and only the first row exists.
    assert db_session.query(User).count() == 1
    assert db_session.query(User).filter(User.email == "dup@example.com").one().name == "First"


def test_bootstrap_admin_translates_db_duplicate_into_bootstrap_refused(db_session, monkeypatch):
    """
    bootstrap_admin() only ever reaches its commit()/IntegrityError-handling
    branch when the pre-flight "any user exists" guard has somehow already
    passed incorrectly (e.g. a race between two concurrent bootstrap
    attempts). This forces exactly that scenario — the guard reports zero
    users despite one already existing — to prove the resulting duplicate
    is still caught, translated into a clean BootstrapRefused, and rolled
    back, rather than leaking a raw IntegrityError.
    """
    existing = User(name="Existing", email="dup2@example.com", password_hash="hash", role="staff")
    db_session.add(existing)
    db_session.commit()

    real_query = db_session.query

    class _FakeZeroCountQuery:
        def count(self):
            return 0

    def fake_query(model, *args, **kwargs):
        if model is User:
            return _FakeZeroCountQuery()
        return real_query(model, *args, **kwargs)

    monkeypatch.setattr(db_session, "query", fake_query)

    with pytest.raises(BootstrapRefused, match="already exists"):
        bootstrap_admin(
            db_session, name="Admin", email="dup2@example.com", password="a-strong-password"
        )

    monkeypatch.undo()
    assert db_session.query(User).count() == 1
