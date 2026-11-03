"""Command-line utilities for WareSphere backend administration.

Usage:
    python -m app.cli bootstrap-admin

This module intentionally has no HTTP-reachable path: bootstrapping the
first administrator account is done out-of-band, by whoever already has
server/deployment access, rather than through the API's authentication
layer. That is a different (and already necessary) trust boundary — running
this command is not an authentication bypass, because no authenticated
request path is ever skipped.
"""

from __future__ import annotations

import argparse
import getpass
import os
import sys

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.security import MIN_PASSWORD_LENGTH, hash_password, validate_and_normalize_email

# NOTE: "it_admin" is not yet a member of app.constants.roles.Role — that
# enum currently defines only STAFF and DIRECTOR (the remaining RBAC roles
# are Phase 1 work, not yet implemented). `role` is still an unconstrained
# free-text column, so using the literal value here is safe and does not
# require touching the RBAC constants module in this phase. Replace this
# with Role.IT_ADMIN once Phase 1 adds it.
BOOTSTRAP_ADMIN_ROLE = "it_admin"

# Fixed, arbitrary key for a PostgreSQL transaction-scoped advisory lock
# (see _acquire_bootstrap_lock below). Advisory locks share one 64-bit
# namespace per database — if any other feature in this codebase ever adds
# its own advisory lock, it MUST use a different key than this one.
BOOTSTRAP_ADVISORY_LOCK_KEY = 87234658123


class BootstrapRefused(Exception):
    """Raised whenever bootstrap cannot proceed — refusal or invalid input."""


def _acquire_bootstrap_lock(db: Session) -> bool:
    """
    Acquire a PostgreSQL transaction-scoped advisory lock so that two
    concurrent `bootstrap-admin` executions cannot both pass the
    "no users exist yet" check before either has committed. See the
    concurrency-strategy note on bootstrap_admin() below for the full
    explanation and its limitations.

    Returns True if the lock was acquired (or if running against a
    non-PostgreSQL engine, where this protection does not apply — see
    limitations). Returns False if another process currently holds it.
    """
    dialect_name = db.bind.dialect.name if db.bind is not None else None
    if dialect_name != "postgresql":
        # SQLite (used only in tests) has no advisory-lock mechanism.
        # There is intentionally no equivalent fallback lock here — see the
        # documented limitation on bootstrap_admin().
        return True
    acquired = db.execute(
        text("SELECT pg_try_advisory_xact_lock(:key)"),
        {"key": BOOTSTRAP_ADVISORY_LOCK_KEY},
    ).scalar()
    return bool(acquired)


def bootstrap_admin(db: Session, *, name: str, email: str, password: str) -> User:
    """
    Create exactly one it_admin user, refusing if any user already exists.

    Pure function: takes an explicit session and already-resolved
    credentials, performs no I/O (no prompts, no printing, no logging of
    the password at any point) so it can be tested directly. Raises
    BootstrapRefused for any validation, concurrency, or state failure; the
    transaction is left rolled back on any failure path.

    CONCURRENCY STRATEGY (PostgreSQL):
    A plain `count() == 0` pre-check has a classic time-of-check/time-of-use
    race: two concurrent processes can both observe zero users before
    either commits, and — since they may use different email addresses —
    the `users.email` UNIQUE constraint alone would not stop both from
    succeeding. This function closes that gap with a PostgreSQL
    transaction-scoped advisory lock (`pg_try_advisory_xact_lock`),
    acquired *before* the existence check:
      - The lock is tied to the current transaction and is released
        automatically on commit or rollback — it cannot be leaked by a
        crashed process holding it forever.
      - A second, concurrent execution that cannot acquire the lock fails
        immediately (non-blocking `pg_try_...`) with a clear refusal,
        rather than hanging or silently racing.
      - Only after the lock is held does this function check
        `count() == 0` and then insert — that check-then-act sequence is
        now atomic with respect to any other bootstrap-admin execution.
      - The `users.email` UNIQUE constraint remains as a second,
        independent backstop (unchanged, not weakened) for the case where
        two processes happen to submit the exact same email.

    LIMITATIONS:
      - This protection is PostgreSQL-specific. Against any other engine
        (in practice, only SQLite, used solely by this project's test
        suite) `_acquire_bootstrap_lock` is a no-op that always returns
        True — there is no advisory-lock equivalent in SQLite, so
        concurrent SQLite test runs are NOT protected against this race.
        This is a deliberate, documented limitation, not an oversight: the
        real system only ever runs against PostgreSQL.
      - The lock only protects the window this function actually holds a
        transaction open; it says nothing about processes that don't call
        this function (e.g., a row inserted directly via psql).
      - This is a single-database-wide lock, appropriate for a "run this
        once, ever" bootstrap action — it would be the wrong tool for any
        higher-frequency contention scenario.
    """
    # Email/password validation happens before any statement is issued on
    # `db`, so no transaction has begun yet at this point — no rollback is
    # needed here. Every raise point from here on does touch `db` first
    # (the advisory lock or the count() check), so each is followed by an
    # explicit rollback below, uniformly, rather than relying on the
    # caller's cleanup discipline.
    try:
        normalized_email = validate_and_normalize_email(email)
    except ValueError as exc:
        raise BootstrapRefused(str(exc)) from exc
    if not password or len(password) < MIN_PASSWORD_LENGTH:
        raise BootstrapRefused(f"password must be at least {MIN_PASSWORD_LENGTH} characters")

    if not _acquire_bootstrap_lock(db):
        # No explicit rollback needed here: the lock was never acquired in
        # this transaction, so there is nothing of ours to release. Still
        # roll back defensively so this function never depends on the
        # caller's cleanup discipline for correctness.
        db.rollback()
        raise BootstrapRefused(
            "another bootstrap-admin execution is already in progress; try again shortly"
        )

    if db.query(User).count() > 0:
        # The advisory lock (if on PostgreSQL) IS held at this point — it
        # must be released by rolling back before raising, not left for the
        # caller to eventually close/rollback on our behalf.
        db.rollback()
        raise BootstrapRefused("refusing to bootstrap: at least one user already exists")

    user = User(
        name=name,
        email=normalized_email,
        password_hash=hash_password(password),
        role=BOOTSTRAP_ADMIN_ROLE,
        is_active=True,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise BootstrapRefused("a user with this email already exists") from exc
    db.refresh(user)
    return user


def _read_credentials() -> tuple[str, str, str]:
    """
    Resolve name/email/password from environment variables first, falling
    back to interactive prompts. Never hardcoded anywhere.
    """
    name = os.environ.get("BOOTSTRAP_ADMIN_NAME", "Administrator")
    email = os.environ.get("BOOTSTRAP_ADMIN_EMAIL")
    password = os.environ.get("BOOTSTRAP_ADMIN_PASSWORD")

    if not email:
        email = input("Admin email: ").strip()

    if not password:
        password = getpass.getpass("Admin password: ")
        confirm = getpass.getpass("Confirm password: ")
        if password != confirm:
            raise BootstrapRefused("passwords do not match")

    return name, email, password


def _cmd_bootstrap_admin() -> int:
    try:
        name, email, password = _read_credentials()
    except BootstrapRefused as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    db = SessionLocal()
    try:
        user = bootstrap_admin(db, name=name, email=email, password=password)
    except BootstrapRefused as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    finally:
        db.close()

    # Never print the password or password_hash — only non-secret identifiers.
    print(f"Bootstrap admin created: id={user.id} email={user.email} role={user.role}")
    return 0


def _cmd_seed_rbac() -> int:
    from app.rbac_seed import seed_rbac

    db = SessionLocal()
    try:
        created = seed_rbac(db)
    finally:
        db.close()

    print(
        "RBAC seed complete — created "
        f"{created['roles']} role(s), {created['permissions']} permission(s), "
        f"{created['role_permissions']} role-permission mapping(s) "
        "(0 for any of these means they already existed)."
    )
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("bootstrap-admin", help="Create the first it_admin account")
    subparsers.add_parser(
        "seed-rbac", help="Idempotently create default roles, permissions, and mappings"
    )
    args = parser.parse_args(argv)

    if args.command == "bootstrap-admin":
        return _cmd_bootstrap_admin()
    if args.command == "seed-rbac":
        return _cmd_seed_rbac()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
