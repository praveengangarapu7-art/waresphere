"""Tests for app.rbac_seed.seed_rbac — idempotent seeding of the 9 approved
roles, 27 approved permissions, and their role-permission mappings. Runs
against the shared in-memory SQLite `db_session` fixture (see conftest.py).
"""

from app.constants.roles import Role as RoleEnum
from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.rbac_seed import PERMISSIONS, ROLE_PERMISSIONS, ROLES, seed_rbac


def test_role_enum_matches_seed_data_exactly():
    """
    app.constants.roles.Role must name exactly the same 9 roles as
    app.rbac_seed.ROLES — app.authorization resolves a user's permissions
    by looking up Role WHERE name == user.role, so any drift between the
    enum and the seed data would let a role exist in code that maps to no
    seeded permissions (or vice versa) without anything catching it.
    """
    enum_names = {r.value for r in RoleEnum}
    seed_names = {name for name, _ in ROLES}
    assert enum_names == seed_names
    assert len(enum_names) == 9


def test_seed_creates_exactly_9_roles(db_session):
    seed_rbac(db_session)

    role_names = {r.name for r in db_session.query(Role).all()}
    expected_names = {name for name, _ in ROLES}
    assert role_names == expected_names
    assert len(role_names) == len(ROLES) == 9


def test_seed_creates_exactly_27_permissions(db_session):
    seed_rbac(db_session)

    codes = {p.code for p in db_session.query(Permission).all()}
    expected_codes = {code for code, _, _ in PERMISSIONS}
    assert codes == expected_codes
    assert len(codes) == len(PERMISSIONS) == 27


def test_seed_creates_the_exact_expected_number_of_mappings(db_session):
    created = seed_rbac(db_session)

    expected_total = sum(len(codes) for codes in ROLE_PERMISSIONS.values())
    assert created["role_permissions"] == expected_total
    assert db_session.query(RolePermission).count() == expected_total


def test_seed_is_idempotent_across_repeated_runs(db_session):
    first = seed_rbac(db_session)
    assert first["roles"] == 9
    assert first["permissions"] == len(PERMISSIONS) == 27
    assert first["role_permissions"] == sum(len(c) for c in ROLE_PERMISSIONS.values())

    role_count_after_first = db_session.query(Role).count()
    permission_count_after_first = db_session.query(Permission).count()
    mapping_count_after_first = db_session.query(RolePermission).count()

    second = seed_rbac(db_session)
    assert second == {"roles": 0, "permissions": 0, "role_permissions": 0}

    # No duplicates: row counts must be identical after the second run.
    assert db_session.query(Role).count() == role_count_after_first
    assert db_session.query(Permission).count() == permission_count_after_first
    assert db_session.query(RolePermission).count() == mapping_count_after_first

    third = seed_rbac(db_session)
    assert third == {"roles": 0, "permissions": 0, "role_permissions": 0}


def test_seed_tolerates_a_role_or_permission_already_partially_seeded(db_session):
    """
    Idempotency must hold even if some rows already exist from a prior
    partial run (e.g. a crash mid-seed) — not just on a fully-empty or
    fully-seeded database.
    """
    db_session.add(Role(name="external_auditor", description="pre-existing"))
    db_session.add(Permission(code="users.read", category="users", description="pre-existing"))
    db_session.commit()

    created = seed_rbac(db_session)

    assert created["roles"] == len(ROLES) - 1
    assert created["permissions"] == len(PERMISSIONS) - 1
    assert db_session.query(Role).filter(Role.name == "external_auditor").count() == 1
    assert db_session.query(Permission).filter(Permission.code == "users.read").count() == 1

    # The pre-existing role must still end up with all its expected
    # permission mappings, not be skipped just because the role row itself
    # already existed.
    auditor = db_session.query(Role).filter(Role.name == "external_auditor").one()
    mapped_codes = {
        rp.permission.code for rp in db_session.query(RolePermission).filter(RolePermission.role_id == auditor.id)
    }
    assert mapped_codes == set(ROLE_PERMISSIONS["external_auditor"])


def test_seed_does_not_remove_rows_from_a_previously_seeded_different_architecture(db_session):
    """
    seed_rbac() is documented as purely additive — it must never delete or
    rename a role/permission/mapping just because it is not part of the
    current ROLES/PERMISSIONS/ROLE_PERMISSIONS definitions. This directly
    exercises that guarantee using a role name from the prior (now
    superseded) 8-role architecture as a stand-in for "stale" data.
    """
    db_session.add(Role(name="super_admin", description="stale role from a prior architecture"))
    db_session.commit()

    seed_rbac(db_session)

    # The stale role must still be present — seeding is additive-only.
    assert db_session.query(Role).filter(Role.name == "super_admin").count() == 1
    # And all 9 currently-approved roles must also now exist alongside it.
    current_names = {name for name, _ in ROLES}
    seeded_names = {r.name for r in db_session.query(Role).all()}
    assert current_names.issubset(seeded_names)


def test_finance_compliance_role_has_no_operational_write_permissions(db_session):
    """
    Documents and enforces the access-boundary decision from the seed data:
    finance_compliance holds only read + its own report/compliance
    approval permissions, never any *.manage/*.adjust/*.reserve/*.create
    permission, and never transfers.receive.
    """
    seed_rbac(db_session)
    finance_compliance = db_session.query(Role).filter(Role.name == "finance_compliance").one()
    codes = {
        rp.permission.code
        for rp in db_session.query(RolePermission).filter(RolePermission.role_id == finance_compliance.id)
    }

    forbidden_suffixes = (".manage", ".adjust", ".reserve", ".create")
    assert not any(code.endswith(forbidden_suffixes) for code in codes)
    assert "transfers.receive" not in codes
    assert "reports.approve" in codes
    assert "compliance.read" in codes
    assert "products.cost.read" in codes


def test_external_auditor_role_is_strictly_read_only(db_session):
    """
    Documents and enforces the access-boundary decision: external_auditor
    holds exactly the read-type permission from every category it has
    access to (including users.access_audit, a restricted view) and zero
    write/manage/approve/create permissions anywhere.
    """
    seed_rbac(db_session)
    auditor = db_session.query(Role).filter(Role.name == "external_auditor").one()
    codes = {
        rp.permission.code
        for rp in db_session.query(RolePermission).filter(RolePermission.role_id == auditor.id)
    }

    forbidden_suffixes = (".manage", ".adjust", ".reserve", ".create", ".approve")
    assert not any(code.endswith(forbidden_suffixes) for code in codes)
    assert "transfers.receive" not in codes
    assert "transfers.create" not in codes
    assert codes == set(ROLE_PERMISSIONS["external_auditor"])


def test_it_admin_excludes_report_approval_and_operational_permissions(db_session):
    """
    Documents and enforces the restored-architecture rule: the system-admin
    role (it_admin) must not hold report-approval authority or any
    operational write permission by default (separation of duties between
    system administration and business/operational execution), while still
    holding its own users.manage/users.read/system.manage administration
    permissions.
    """
    seed_rbac(db_session)
    it_admin = db_session.query(Role).filter(Role.name == "it_admin").one()
    codes = {
        rp.permission.code
        for rp in db_session.query(RolePermission).filter(RolePermission.role_id == it_admin.id)
    }

    assert "reports.approve" not in codes
    assert "inventory.adjust" not in codes
    assert "orders.manage" not in codes
    assert "transfers.approve" not in codes
    assert "transfers.create" not in codes
    assert "users.manage" in codes
    assert "users.read" in codes
    assert "system.manage" in codes


def test_quality_inspector_role_has_only_the_scoped_quality_permission(db_session):
    """
    Documents and enforces the deliberately narrow scope of
    quality_inspector: it holds quality.inspect but none of the broader
    products.manage/orders.manage permissions a naive design might grant.
    """
    seed_rbac(db_session)
    quality_inspector = db_session.query(Role).filter(Role.name == "quality_inspector").one()
    codes = {
        rp.permission.code
        for rp in db_session.query(RolePermission).filter(RolePermission.role_id == quality_inspector.id)
    }

    assert "quality.inspect" in codes
    assert "products.manage" not in codes
    assert "orders.manage" not in codes
