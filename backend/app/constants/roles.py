"""Centralized role definitions for the WareSphere backend.

This is the single source of truth for which role values are recognized —
now the full, approved 9-role RBAC architecture (see app.rbac_seed for the
matching permission grants seeded into the roles/permissions/
role_permissions tables). It does NOT itself enforce anything on its own:
the `role` column on the User model (app/models/user.py) remains a plain
string, not an FK — authorization enforcement (Phase 2B) resolves a user's
permissions by looking up app.models.role.Role WHERE name == user.role, so
every value here must exactly match a name in app.rbac_seed.ROLES.
"""

from enum import Enum


class Role(str, Enum):
    STAFF = "staff"

    # Company-wide/strategic role: dashboards, KPIs, inventory value,
    # compliance/risk views, reports, and report-approval authority. No
    # direct inventory quantity modification by default.
    DIRECTOR = "director"

    # Full operational authority within an assigned warehouse, including
    # facility configuration and transfer approval.
    WAREHOUSE_MANAGER = "warehouse_manager"

    # Full day-to-day operational authority within an assigned warehouse,
    # without facility-configuration or transfer-approval authority.
    WAREHOUSE_SUPERVISOR = "warehouse_supervisor"

    # Company-wide product/catalog governance and cost visibility, without
    # direct inventory correction authority.
    INVENTORY_CONTROLLER = "inventory_controller"

    # Warehouse-scoped quality inspection authority: batch status
    # transitions and inbound quality fields.
    QUALITY_INSPECTOR = "quality_inspector"

    # Company-wide financial, reporting, and compliance oversight. Read and
    # approval authority only — no operational permissions.
    FINANCE_COMPLIANCE = "finance_compliance"

    # System/account administration. No business report or financial
    # approval authority by default.
    IT_ADMIN = "it_admin"

    # Company-wide, strictly read-only access for compliance and
    # access-control review.
    EXTERNAL_AUDITOR = "external_auditor"


DEFAULT_ROLE: str = Role.STAFF.value

# All role values currently recognized by the backend.
ROLES: tuple[str, ...] = tuple(role.value for role in Role)
