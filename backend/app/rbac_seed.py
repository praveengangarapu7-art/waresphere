"""Default RBAC seed data and idempotent seeding logic.

Introduces the 9 APPROVED roles and their 27 granular permissions. This
restores the originally-approved 9-role/27-permission architecture, which a
prior (Phase 1) revision had temporarily replaced with a different 8-role/
22-permission design (super_admin, warehouse_operator, inventory_manager,
procurement_manager, logistics_manager, finance, auditor). That design is
fully superseded by this one — see the Phase "restore 9-role architecture"
report for the full history.

This module is data only — no authentication or authorization enforcement
is implemented here or anywhere yet; these tables exist as the RBAC
foundation for a future phase.

Design notes on specific access-boundary decisions (unchanged from the
original multi-round review that approved this exact matrix):

- it_admin holds broad read access plus users.manage/users.read/
  system.manage, but explicitly NOT reports.approve or any operational
  write permission (no *.manage on inventory/orders/warehouse, no
  inventory.adjust/reserve, no transfers.*). A system-administration role
  does not, by itself, justify business/financial approval authority or
  operational execution — that separation of duties is intentional.

- finance_compliance and director both hold reports.approve —
  deliberately two independent approvers rather than concentrating all
  report-approval power in one role.

- external_auditor is strictly read-only across every category it has
  access to (including users.access_audit, a restricted view for
  access-control review, and products.cost.read for financial/valuation
  audit) — zero write/manage/approve/create permissions anywhere.

- quality_inspector holds a single, precisely-scoped quality.inspect
  permission (batch status transitions + inbound quality fields) rather
  than the broader products.manage/orders.manage a naive design might
  reach for — deliberately narrow, per the earlier excessive-permission
  review.

- inventory_controller owns product/catalog governance (products.manage,
  products.cost.read) but does NOT hold inventory.adjust or
  movements.create — separating "sets catalog/reorder policy" from
  "executes physical stock corrections," which stays with
  warehouse_manager/warehouse_supervisor.

- transfers.approve is held by warehouse_manager (destination-warehouse-
  scoped, conceptually) and by no one else by default in this restored
  set — inventory_controller does NOT hold it here (unlike some
  intermediate designs), keeping transfer approval authority narrowly
  warehouse-scoped. No warehouse-assignment table or enforcement exists
  yet — this is documented intent for a future phase, not implemented
  here.

- Categories used here (inventory, warehouse, products, batches, quality,
  orders, movements, transfers, reports, compliance, users, system) are a
  more granular breakdown of the task's suggested groupings (warehouse
  operations, inventory, inbound/outbound, quality, finance and
  compliance, reporting, administration, auditing) — preserved from the
  original approved design rather than re-invented.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission

# ---------------------------------------------------------------------------
# Permissions: (code, category, description) — 27 total
# ---------------------------------------------------------------------------
PERMISSIONS: tuple[tuple[str, str, str], ...] = (
    ("inventory.read", "inventory", "View inventory records"),
    ("inventory.adjust", "inventory", "Perform inventory quantity corrections"),
    ("inventory.reserve", "inventory", "Reserve or release inventory for fulfillment"),
    ("warehouse.read", "warehouse", "View warehouse records"),
    ("warehouse.manage", "warehouse", "Create and update warehouse records"),
    ("products.read", "products", "View product catalog records"),
    ("products.manage", "products", "Create and update product catalog master data"),
    ("products.cost.read", "products", "View product cost and valuation data"),
    ("batches.read", "batches", "View batch records"),
    ("batches.create", "batches", "Create new batch records (e.g. at goods receipt)"),
    ("batches.manage", "batches", "Edit existing batch records (non-status fields)"),
    ("quality.inspect", "quality", "Perform quality inspection: batch status transitions and inbound quality fields"),
    ("orders.read", "orders", "View inbound and outbound orders"),
    ("orders.manage", "orders", "Create, update, and cancel inbound and outbound orders"),
    ("orders.fulfill", "orders", "Execute order fulfillment: receiving, picking, and packing progress"),
    ("movements.create", "movements", "Record a stock movement"),
    ("movements.read", "movements", "View the stock movement ledger"),
    ("transfers.create", "transfers", "Initiate an inter-warehouse transfer"),
    ("transfers.approve", "transfers", "Approve a pending inter-warehouse transfer"),
    ("transfers.receive", "transfers", "Confirm receipt of an inter-warehouse transfer"),
    ("reports.read", "reports", "View reports"),
    ("reports.approve", "reports", "Approve reports"),
    ("compliance.read", "compliance", "View compliance and risk data"),
    ("users.manage", "users", "Create, update, and deactivate user accounts"),
    ("users.read", "users", "View full user account details"),
    ("users.access_audit", "users", "View a restricted, non-PII user/role/permission summary for access-control review"),
    ("system.manage", "system", "Manage system-level configuration"),
)

# ---------------------------------------------------------------------------
# Roles: (name, description) — 9 total (existing: staff, director;
# restored/approved: the remaining 7)
# ---------------------------------------------------------------------------
ROLES: tuple[tuple[str, str], ...] = (
    ("staff", "Front-line execution role: receiving, picking, packing, and transfer receipt."),
    (
        "director",
        "Company-wide strategic role: dashboards, KPIs, inventory value, compliance and "
        "risk views, reports, and report-approval authority. No direct inventory quantity "
        "modification by default.",
    ),
    (
        "warehouse_manager",
        "Full operational authority within an assigned warehouse, including facility "
        "configuration and transfer approval.",
    ),
    (
        "warehouse_supervisor",
        "Full day-to-day operational authority within an assigned warehouse, without "
        "facility-configuration or transfer-approval authority.",
    ),
    (
        "inventory_controller",
        "Company-wide product/catalog governance and cost visibility, without direct "
        "inventory correction authority.",
    ),
    ("quality_inspector", "Warehouse-scoped quality inspection authority: batch status and inbound quality fields."),
    (
        "finance_compliance",
        "Company-wide financial, reporting, and compliance oversight. Read and approval "
        "authority only — no operational permissions.",
    ),
    ("it_admin", "System/account administration. No business report or financial approval authority by default."),
    ("external_auditor", "Company-wide, strictly read-only access for compliance and access-control review."),
)

# ---------------------------------------------------------------------------
# Role -> permission grants
# ---------------------------------------------------------------------------
ROLE_PERMISSIONS: dict[str, tuple[str, ...]] = {
    "staff": (
        "inventory.read",
        "warehouse.read",
        "products.read",
        "batches.read",
        "batches.create",
        "orders.read",
        "orders.fulfill",
        "movements.create",
        "transfers.receive",
    ),
    "director": (
        "inventory.read",
        "warehouse.read",
        "products.read",
        "products.cost.read",
        "batches.read",
        "orders.read",
        "movements.read",
        "reports.read",
        "reports.approve",
        "compliance.read",
    ),
    "warehouse_manager": (
        "inventory.read",
        "inventory.adjust",
        "inventory.reserve",
        "warehouse.read",
        "warehouse.manage",
        "products.read",
        "batches.read",
        "batches.create",
        "batches.manage",
        "orders.read",
        "orders.manage",
        "orders.fulfill",
        "movements.create",
        "movements.read",
        "transfers.create",
        "transfers.approve",
        "transfers.receive",
        "reports.read",
    ),
    "warehouse_supervisor": (
        "inventory.read",
        "inventory.adjust",
        "inventory.reserve",
        "warehouse.read",
        "products.read",
        "batches.read",
        "batches.create",
        "batches.manage",
        "orders.read",
        "orders.manage",
        "orders.fulfill",
        "movements.create",
        "movements.read",
        "transfers.create",
        "transfers.receive",
        "reports.read",
    ),
    "inventory_controller": (
        "inventory.read",
        "warehouse.read",
        "products.read",
        "products.manage",
        "products.cost.read",
        "batches.read",
        "orders.read",
        "movements.read",
        "reports.read",
    ),
    "quality_inspector": (
        "inventory.read",
        "warehouse.read",
        "products.read",
        "batches.read",
        "quality.inspect",
        "orders.read",
        "reports.read",
    ),
    "finance_compliance": (
        "inventory.read",
        "warehouse.read",
        "products.read",
        "products.cost.read",
        "batches.read",
        "orders.read",
        "movements.read",
        "reports.read",
        "reports.approve",
        "compliance.read",
    ),
    "it_admin": (
        "inventory.read",
        "warehouse.read",
        "products.read",
        "batches.read",
        "orders.read",
        "movements.read",
        "reports.read",
        "compliance.read",
        "users.manage",
        "users.read",
        "system.manage",
    ),
    "external_auditor": (
        "inventory.read",
        "warehouse.read",
        "products.read",
        "products.cost.read",
        "batches.read",
        "orders.read",
        "movements.read",
        "reports.read",
        "compliance.read",
        "users.access_audit",
    ),
}


def seed_rbac(db: Session) -> dict[str, int]:
    """
    Idempotently ensure all default roles, permissions, and role-permission
    mappings exist. Safe to run repeatedly: existing rows (matched by their
    unique `name`/`code`, or by the (role_id, permission_id) pair) are left
    untouched and never duplicated.

    IMPORTANT: this function is purely additive. It does not delete or
    rename any role/permission/mapping that exists in the database but is
    no longer part of the current ROLES/PERMISSIONS/ROLE_PERMISSIONS
    definitions above (e.g. rows from a previously-seeded, now-superseded
    architecture). If a database was ever seeded with the prior 8-role
    design, those rows will remain after running this updated seed and
    must be cleaned up separately if that is desired — see the "restore
    9-role architecture" report for why this was a deliberate choice
    rather than an automatic destructive reconciliation.

    Returns a summary of how many NEW rows were created in each table
    (all zero on a fully-idempotent re-run).
    """
    created = {"roles": 0, "permissions": 0, "role_permissions": 0}

    role_by_name: dict[str, Role] = {r.name: r for r in db.query(Role).all()}
    for name, description in ROLES:
        if name not in role_by_name:
            role = Role(name=name, description=description)
            db.add(role)
            db.flush()
            role_by_name[name] = role
            created["roles"] += 1

    permission_by_code: dict[str, Permission] = {p.code: p for p in db.query(Permission).all()}
    for code, category, description in PERMISSIONS:
        if code not in permission_by_code:
            permission = Permission(code=code, category=category, description=description)
            db.add(permission)
            db.flush()
            permission_by_code[code] = permission
            created["permissions"] += 1

    existing_pairs = {(rp.role_id, rp.permission_id) for rp in db.query(RolePermission).all()}
    for role_name, permission_codes in ROLE_PERMISSIONS.items():
        role = role_by_name[role_name]
        for code in permission_codes:
            permission = permission_by_code[code]
            pair = (role.id, permission.id)
            if pair not in existing_pairs:
                db.add(RolePermission(role_id=role.id, permission_id=permission.id))
                existing_pairs.add(pair)
                created["role_permissions"] += 1

    db.commit()
    return created
