"""Tests for the Role / Permission / RolePermission models: creation,
uniqueness, relationships, and foreign-key integrity. Uses the shared
in-memory SQLite `db_session` fixture (see conftest.py) — SQLAlchemy's
postgresql.UUID type has already been verified (Phase 0) to fall back
correctly under SQLite, so these are genuine inserts/queries, not mocks.
"""

import uuid

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission


def test_create_role(db_session):
    role = Role(name="warehouse_manager", description="Manages a warehouse")
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)

    assert role.id is not None
    assert role.name == "warehouse_manager"
    assert role.created_at is not None


def test_role_name_must_be_unique(db_session):
    db_session.add(Role(name="external_auditor", description="first"))
    db_session.commit()

    db_session.add(Role(name="external_auditor", description="duplicate"))
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    assert db_session.query(Role).count() == 1


def test_create_permission(db_session):
    permission = Permission(code="inventory.read", category="inventory", description="View inventory")
    db_session.add(permission)
    db_session.commit()
    db_session.refresh(permission)

    assert permission.id is not None
    assert permission.code == "inventory.read"
    assert permission.category == "inventory"


def test_permission_code_must_be_unique(db_session):
    db_session.add(Permission(code="reports.approve", category="reports", description="first"))
    db_session.commit()

    db_session.add(Permission(code="reports.approve", category="reports", description="duplicate"))
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    assert db_session.query(Permission).count() == 1


def test_role_permission_relationship_and_back_populates(db_session):
    role = Role(name="finance_compliance", description="Finance and compliance oversight")
    permission = Permission(code="compliance.read", category="compliance", description="View compliance data")
    db_session.add_all([role, permission])
    db_session.commit()

    link = RolePermission(role_id=role.id, permission_id=permission.id)
    db_session.add(link)
    db_session.commit()
    db_session.refresh(role)
    db_session.refresh(permission)

    assert len(role.role_permissions) == 1
    assert role.role_permissions[0].permission_id == permission.id
    assert len(permission.role_permissions) == 1
    assert permission.role_permissions[0].role_id == role.id
    assert role.role_permissions[0].role is role
    assert permission.role_permissions[0].permission is permission


def test_role_permission_pair_must_be_unique(db_session):
    role = Role(name="external_auditor", description="")
    permission = Permission(code="users.read", category="users", description="")
    db_session.add_all([role, permission])
    db_session.commit()

    db_session.add(RolePermission(role_id=role.id, permission_id=permission.id))
    db_session.commit()

    db_session.add(RolePermission(role_id=role.id, permission_id=permission.id))
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    assert db_session.query(RolePermission).count() == 1


def test_role_permission_requires_a_valid_role_and_permission_id(db_session):
    """
    Foreign-key integrity: role_id/permission_id must reference an existing
    row. SQLite only enforces FKs when explicitly turned on per-connection,
    so this test enables that pragma directly rather than assuming it's on
    by default — this is a known SQLite quirk, not a gap in the models
    themselves (PostgreSQL enforces FKs unconditionally, verified in
    test_rbac_postgres_migrations.py).
    """
    db_session.execute(text("PRAGMA foreign_keys = ON"))

    bogus_role_id = uuid.uuid4()
    bogus_permission_id = uuid.uuid4()
    db_session.add(RolePermission(role_id=bogus_role_id, permission_id=bogus_permission_id))
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    assert db_session.query(RolePermission).count() == 0


def test_deleting_a_role_cascades_to_its_role_permissions(db_session):
    role = Role(name="warehouse_supervisor", description="")
    permission = Permission(code="orders.manage", category="orders", description="")
    db_session.add_all([role, permission])
    db_session.commit()

    db_session.add(RolePermission(role_id=role.id, permission_id=permission.id))
    db_session.commit()
    assert db_session.query(RolePermission).count() == 1

    db_session.delete(role)
    db_session.commit()

    assert db_session.query(RolePermission).count() == 0
    # The permission itself is untouched — only the mapping was owned by the role.
    assert db_session.query(Permission).count() == 1
