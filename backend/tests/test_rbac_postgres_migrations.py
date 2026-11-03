"""PostgreSQL-specific tests for the RBAC schema (roles, permissions,
role_permissions): real foreign-key enforcement, unique constraints, and
idempotent seeding, all against an actual PostgreSQL instance rather than
SQLite.

WHY THIS MAY NOT RUN LOCALLY: see tests/pg_test_utils.py. This requires a
dedicated, explicitly-configured TEST_DATABASE_URL and never falls back to
DATABASE_URL (the application's runtime connection string) — this test
deletes rows as part of its own setup/teardown, so it must never risk doing
that against a database it wasn't explicitly pointed at.
"""

import uuid

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.rbac_seed import PERMISSIONS, ROLE_PERMISSIONS, ROLES, seed_rbac
from tests.pg_test_utils import postgres_test_engine_or_skip

RBAC_TABLES = [Role.__table__, Permission.__table__, RolePermission.__table__]


@pytest.fixture(scope="module")
def postgres_engine():
    engine = postgres_test_engine_or_skip()
    yield engine
    engine.dispose()


@pytest.fixture()
def postgres_session(postgres_engine):
    Base.metadata.create_all(bind=postgres_engine, tables=RBAC_TABLES, checkfirst=True)
    factory = sessionmaker(bind=postgres_engine)

    cleanup = factory()
    cleanup.query(RolePermission).delete()
    cleanup.query(Role).delete()
    cleanup.query(Permission).delete()
    cleanup.commit()
    cleanup.close()

    session = factory()
    try:
        yield session
    finally:
        session.rollback()
        session.query(RolePermission).delete()
        session.query(Role).delete()
        session.query(Permission).delete()
        session.commit()
        session.close()


def test_postgres_enforces_role_name_uniqueness(postgres_session):
    postgres_session.add(Role(name="finance_compliance", description="first"))
    postgres_session.commit()

    postgres_session.add(Role(name="finance_compliance", description="duplicate"))
    with pytest.raises(IntegrityError):
        postgres_session.commit()
    postgres_session.rollback()

    assert postgres_session.query(Role).count() == 1


def test_postgres_enforces_permission_code_uniqueness(postgres_session):
    postgres_session.add(Permission(code="movements.read", category="movements", description="first"))
    postgres_session.commit()

    postgres_session.add(Permission(code="movements.read", category="movements", description="duplicate"))
    with pytest.raises(IntegrityError):
        postgres_session.commit()
    postgres_session.rollback()

    assert postgres_session.query(Permission).count() == 1


def test_postgres_enforces_role_permission_foreign_keys_without_any_pragma(postgres_session):
    """
    Unlike SQLite (which only enforces foreign keys when a per-connection
    PRAGMA is explicitly set — see test_rbac_models.py), PostgreSQL enforces
    them unconditionally. This confirms that real guarantee directly,
    without any special setup.
    """
    postgres_session.add(
        RolePermission(role_id=uuid.uuid4(), permission_id=uuid.uuid4())
    )
    with pytest.raises(IntegrityError):
        postgres_session.commit()
    postgres_session.rollback()

    assert postgres_session.query(RolePermission).count() == 0


def test_postgres_enforces_role_permission_pair_uniqueness(postgres_session):
    role = Role(name="external_auditor", description="")
    permission = Permission(code="reports.read", category="reports", description="")
    postgres_session.add_all([role, permission])
    postgres_session.commit()

    postgres_session.add(RolePermission(role_id=role.id, permission_id=permission.id))
    postgres_session.commit()

    postgres_session.add(RolePermission(role_id=role.id, permission_id=permission.id))
    with pytest.raises(IntegrityError):
        postgres_session.commit()
    postgres_session.rollback()

    assert postgres_session.query(RolePermission).count() == 1


def test_postgres_seed_rbac_is_idempotent(postgres_session):
    first = seed_rbac(postgres_session)
    assert first["roles"] == len(ROLES)
    assert first["permissions"] == len(PERMISSIONS)
    assert first["role_permissions"] == sum(len(c) for c in ROLE_PERMISSIONS.values())

    second = seed_rbac(postgres_session)
    assert second == {"roles": 0, "permissions": 0, "role_permissions": 0}

    assert postgres_session.query(Role).count() == len(ROLES)
    assert postgres_session.query(Permission).count() == len(PERMISSIONS)
    assert postgres_session.query(RolePermission).count() == sum(
        len(c) for c in ROLE_PERMISSIONS.values()
    )
