"""End-to-end Alembic migration lifecycle tests: upgrade, downgrade, and
re-upgrade across the existing 2-migration history (baseline schema, then
RBAC tables) — Task 6/7 explicitly require verifying this directly, not
just the resulting schema/data correctness the other RBAC test files cover.

Runs against a freshly created, uniquely-named database on the same
PostgreSQL server as TEST_DATABASE_URL — created and dropped entirely
within this test, never touching TEST_DATABASE_URL's own database, and
never falling back to DATABASE_URL (the application's runtime connection
string) under any circumstances — see tests/pg_test_utils.py. Skips, with a
clear reason, if TEST_DATABASE_URL is not configured or not reachable.

This does NOT create a new/"dangerous" baseline migration — it exercises
the two migrations that already exist (a04dd13087b9 "baseline schema" and
80809a5f4409 "add rbac tables"), confirming both directions of both work.
"""

import uuid
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

from tests.pg_test_utils import get_test_database_url, postgres_test_engine_or_skip

BACKEND_DIR = Path(__file__).resolve().parent.parent
ALEMBIC_INI = BACKEND_DIR / "alembic.ini"

EXPECTED_BASELINE_TABLES = {
    "products",
    "suppliers",
    "users",
    "warehouses",
    "batches",
    "inbound_orders",
    "outbound_orders",
    "zones",
    "bins",
    "inbound_order_line_items",
    "outbound_order_line_items",
    "inventory",
    "stock_movements",
}
RBAC_TABLES = {"roles", "permissions", "role_permissions"}


def _table_names(engine) -> set[str]:
    with engine.connect() as conn:
        return {
            row[0]
            for row in conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'"))
        }


@pytest.fixture()
def fresh_migration_database():
    # Validates TEST_DATABASE_URL is configured and reachable — skips
    # cleanly (never falls back to DATABASE_URL) if not. This engine is
    # only used for the reachability check; the actual admin connection
    # below needs AUTOCOMMIT isolation to run CREATE/DROP DATABASE.
    probe_engine = postgres_test_engine_or_skip()
    probe_engine.dispose()

    base_url = make_url(get_test_database_url())
    admin_engine = create_engine(base_url, isolation_level="AUTOCOMMIT")
    test_db_name = f"waresphere_migration_test_{uuid.uuid4().hex[:12]}"

    with admin_engine.connect() as conn:
        conn.execute(text(f'CREATE DATABASE "{test_db_name}"'))

    # NOTE: plain str(url)/URL.__str__ masks the password as "***" for safe
    # display (SQLAlchemy 2.x default) — render_as_string(hide_password=False)
    # is required to get a connection string that actually authenticates.
    test_url = base_url.set(database=test_db_name).render_as_string(hide_password=False)

    try:
        yield test_url
    finally:
        with admin_engine.connect() as conn:
            conn.execute(
                text(
                    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                    "WHERE datname = :dbname AND pid <> pg_backend_pid()"
                ),
                {"dbname": test_db_name},
            )
            conn.execute(text(f'DROP DATABASE IF EXISTS "{test_db_name}"'))
        admin_engine.dispose()


def _alembic_config(database_url: str) -> Config:
    cfg = Config(str(ALEMBIC_INI))
    cfg.set_main_option("sqlalchemy.url", database_url)
    return cfg


def test_upgrade_from_fresh_database_creates_baseline_and_rbac_tables(fresh_migration_database):
    cfg = _alembic_config(fresh_migration_database)
    command.upgrade(cfg, "head")

    engine = create_engine(fresh_migration_database)
    try:
        tables = _table_names(engine)
        assert EXPECTED_BASELINE_TABLES.issubset(tables)
        assert RBAC_TABLES.issubset(tables)
        assert "alembic_version" in tables
    finally:
        engine.dispose()


def test_downgrade_from_head_removes_only_rbac_tables(fresh_migration_database):
    """
    Simulates "existing database with Phase 1 RBAC tables" -> downgrade:
    rolling back the RBAC migration must remove exactly the 3 RBAC tables
    and leave the original baseline schema completely intact.
    """
    cfg = _alembic_config(fresh_migration_database)
    command.upgrade(cfg, "head")
    command.downgrade(cfg, "-1")

    engine = create_engine(fresh_migration_database)
    try:
        tables = _table_names(engine)
        assert not (RBAC_TABLES & tables), f"RBAC tables should be gone, found: {RBAC_TABLES & tables}"
        assert EXPECTED_BASELINE_TABLES.issubset(tables)
    finally:
        engine.dispose()


def test_reupgrade_after_downgrade_recreates_rbac_tables(fresh_migration_database):
    """
    "Existing database with Phase 1 RBAC tables" -> downgrade -> re-upgrade:
    the RBAC tables must come back cleanly with no leftover state from the
    prior downgrade causing a conflict.
    """
    cfg = _alembic_config(fresh_migration_database)
    command.upgrade(cfg, "head")
    command.downgrade(cfg, "-1")
    command.upgrade(cfg, "head")

    engine = create_engine(fresh_migration_database)
    try:
        tables = _table_names(engine)
        assert RBAC_TABLES.issubset(tables)
        assert EXPECTED_BASELINE_TABLES.issubset(tables)

        with engine.connect() as conn:
            version = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
        assert version == "80809a5f4409"
    finally:
        engine.dispose()


def test_seed_rbac_works_immediately_after_migration_upgrade(fresh_migration_database):
    """
    End-to-end: a freshly migrated database (via Alembic, not
    Base.metadata.create_all) must be immediately usable by seed_rbac()
    with no further setup.
    """
    from sqlalchemy.orm import sessionmaker

    from app.rbac_seed import PERMISSIONS, ROLE_PERMISSIONS, ROLES, seed_rbac

    cfg = _alembic_config(fresh_migration_database)
    command.upgrade(cfg, "head")

    engine = create_engine(fresh_migration_database)
    try:
        session = sessionmaker(bind=engine)()
        try:
            created = seed_rbac(session)
            assert created["roles"] == len(ROLES) == 9
            assert created["permissions"] == len(PERMISSIONS) == 27
            assert created["role_permissions"] == sum(len(c) for c in ROLE_PERMISSIONS.values())
        finally:
            session.close()
    finally:
        engine.dispose()
