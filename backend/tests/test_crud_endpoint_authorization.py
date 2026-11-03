"""Authorization tests for require_permission wiring on the existing CRUD
endpoints (Phase 2B Stage 3): warehouses, products, batches, inventory,
inbound-orders, outbound-orders, stock-movements. No business logic is
exercised here — every endpoint below still either returns its existing
"honest empty list" (the six bare GET "" list routes) or raises the
existing 501 not_implemented() stub; these tests only confirm
authentication/authorization runs correctly before that point.

Same fixture pattern as test_action_endpoint_authorization.py: real
app.main.app, get_db overridden to an isolated in-memory SQLite database
(StaticPool), seeded via seed_rbac(); no PostgreSQL connection of any kind.

Permission <-> role note: several *.read permissions (warehouse.read,
products.read, batches.read, inventory.read, orders.read) are granted to
ALL 9 seeded roles by design (broad read visibility is intentional in this
RBAC matrix) — there is no real seeded role that lacks them. For those
cases only, NO_PERM_ROLE (a deliberately unseeded role name) is used to
exercise the fail-closed 403 path instead of a real role, matching the
same pattern already verified in test_authorization.py.
"""

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401  (registers every model on Base.metadata)
from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.rbac_seed import seed_rbac
from app.security import hash_password

TEST_PASSWORD = "correct-horse-battery-staple"
NO_PERM_ROLE = "no-seeded-permissions"  # not a real seeded role — see module docstring


def _id() -> str:
    return str(uuid.uuid4())


# (label, method, path, json body, permission, role WITHOUT it, role WITH it, expected status when authorized)
CRUD_ENDPOINTS = [
    ("warehouses.list", "GET", "/api/v1/warehouses", None, "warehouse.read", NO_PERM_ROLE, "staff", 200),
    ("warehouses.get", "GET", f"/api/v1/warehouses/{_id()}", None, "warehouse.read", NO_PERM_ROLE, "staff", 501),
    ("warehouses.create", "POST", "/api/v1/warehouses", {"name": "Main", "code": "WH1"}, "warehouse.manage", "staff", "warehouse_manager", 501),
    ("warehouses.update", "PATCH", f"/api/v1/warehouses/{_id()}", {"name": "Main2"}, "warehouse.manage", "staff", "warehouse_manager", 501),
    ("warehouses.delete", "DELETE", f"/api/v1/warehouses/{_id()}", None, "warehouse.manage", "staff", "warehouse_manager", 501),

    ("products.list", "GET", "/api/v1/products", None, "products.read", NO_PERM_ROLE, "staff", 200),
    ("products.get", "GET", f"/api/v1/products/{_id()}", None, "products.read", NO_PERM_ROLE, "staff", 501),
    ("products.create", "POST", "/api/v1/products", {"sku_code": "SKU1", "name": "Widget", "unit_cost": 1.5}, "products.manage", "staff", "inventory_controller", 501),
    ("products.update", "PATCH", f"/api/v1/products/{_id()}", {"name": "Widget2"}, "products.manage", "staff", "inventory_controller", 501),
    ("products.delete", "DELETE", f"/api/v1/products/{_id()}", None, "products.manage", "staff", "inventory_controller", 501),

    ("batches.list", "GET", "/api/v1/batches", None, "batches.read", NO_PERM_ROLE, "staff", 200),
    ("batches.get", "GET", f"/api/v1/batches/{_id()}", None, "batches.read", NO_PERM_ROLE, "staff", 501),
    ("batches.create", "POST", "/api/v1/batches", {"product_id": _id(), "batch_number": "B1"}, "batches.create", "director", "staff", 501),
    ("batches.update", "PATCH", f"/api/v1/batches/{_id()}", {"status": "accepted"}, "batches.manage", "staff", "warehouse_manager", 501),
    ("batches.delete", "DELETE", f"/api/v1/batches/{_id()}", None, "batches.manage", "staff", "warehouse_manager", 501),

    ("inventory.list", "GET", "/api/v1/inventory", None, "inventory.read", NO_PERM_ROLE, "staff", 200),
    ("inventory.get", "GET", f"/api/v1/inventory/{_id()}", None, "inventory.read", NO_PERM_ROLE, "staff", 501),
    ("inventory.create", "POST", "/api/v1/inventory", {"product_id": _id(), "batch_id": _id(), "quantity": 10}, "inventory.adjust", "staff", "warehouse_manager", 501),
    ("inventory.update", "PATCH", f"/api/v1/inventory/{_id()}", {"bin_id": _id()}, "inventory.adjust", "staff", "warehouse_manager", 501),
    ("inventory.delete", "DELETE", f"/api/v1/inventory/{_id()}", None, "inventory.adjust", "staff", "warehouse_manager", 501),
    ("inventory.adjust", "POST", f"/api/v1/inventory/{_id()}/adjust", {"new_quantity": 5, "reason": "count"}, "inventory.adjust", "staff", "warehouse_manager", 501),
    ("inventory.reserve", "POST", f"/api/v1/inventory/{_id()}/reserve", {"quantity": 1}, "inventory.reserve", "staff", "warehouse_manager", 501),
    ("inventory.release", "POST", f"/api/v1/inventory/{_id()}/release", {"quantity": 1}, "inventory.reserve", "staff", "warehouse_manager", 501),

    ("inbound_orders.list", "GET", "/api/v1/inbound-orders", None, "orders.read", NO_PERM_ROLE, "staff", 200),
    ("inbound_orders.get", "GET", f"/api/v1/inbound-orders/{_id()}", None, "orders.read", NO_PERM_ROLE, "staff", 501),
    ("inbound_orders.create", "POST", "/api/v1/inbound-orders", {"order_number": "IN1", "warehouse_id": _id()}, "orders.manage", "staff", "warehouse_manager", 501),
    ("inbound_orders.update", "PATCH", f"/api/v1/inbound-orders/{_id()}", {"status": "received"}, "orders.manage", "staff", "warehouse_manager", 501),
    ("inbound_orders.delete", "DELETE", f"/api/v1/inbound-orders/{_id()}", None, "orders.manage", "staff", "warehouse_manager", 501),
    ("inbound_orders.line_items", "POST", f"/api/v1/inbound-orders/{_id()}/line-items", {"product_id": _id(), "expected_qty": 10}, "orders.manage", "staff", "warehouse_manager", 501),

    ("outbound_orders.list", "GET", "/api/v1/outbound-orders", None, "orders.read", NO_PERM_ROLE, "staff", 200),
    ("outbound_orders.get", "GET", f"/api/v1/outbound-orders/{_id()}", None, "orders.read", NO_PERM_ROLE, "staff", 501),
    ("outbound_orders.create", "POST", "/api/v1/outbound-orders", {"order_number": "OUT1", "warehouse_id": _id()}, "orders.manage", "staff", "warehouse_manager", 501),
    ("outbound_orders.update", "PATCH", f"/api/v1/outbound-orders/{_id()}", {"status": "shipped"}, "orders.manage", "staff", "warehouse_manager", 501),
    ("outbound_orders.delete", "DELETE", f"/api/v1/outbound-orders/{_id()}", None, "orders.manage", "staff", "warehouse_manager", 501),
    ("outbound_orders.line_items", "POST", f"/api/v1/outbound-orders/{_id()}/line-items", {"product_id": _id(), "ordered_qty": 5}, "orders.manage", "staff", "warehouse_manager", 501),

    ("stock_movements.list", "GET", "/api/v1/stock-movements", None, "movements.read", "staff", "director", 200),
    ("stock_movements.get", "GET", f"/api/v1/stock-movements/{_id()}", None, "movements.read", "staff", "director", 501),
    ("stock_movements.create", "POST", "/api/v1/stock-movements", {"product_id": _id(), "movement_type": "Adjustment", "quantity": 1}, "movements.create", "director", "staff", 501),
]


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine)

    seed_session = TestingSessionLocal()
    seed_rbac(seed_session)
    seed_session.close()

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app), TestingSessionLocal
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


_login_cache: dict = {}


def _token_for_role(client, sessionmaker_, role: str) -> str:
    """Creates (once per test, cached by role) a user with the given role
    directly in the test database — bypassing /auth/register, which always
    forces "staff" — then logs in via the real /auth/login endpoint."""
    if role in _login_cache:
        return _login_cache[role]

    email = f"{role.replace(' ', '_')}@example.com"
    session = sessionmaker_()
    session.add(
        User(
            name="Test User",
            email=email,
            password_hash=hash_password(TEST_PASSWORD),
            role=role,
            is_active=True,
        )
    )
    session.commit()
    session.close()

    login_resp = client.post("/api/v1/auth/login", json={"email": email, "password": TEST_PASSWORD})
    assert login_resp.status_code == 200, login_resp.text
    token = login_resp.json()["access_token"]
    _login_cache[role] = token
    return token


@pytest.fixture(autouse=True)
def _clear_login_cache():
    # Each test gets a fresh in-memory database (see `client` fixture), so
    # tokens/users from a previous test are no longer valid against it.
    _login_cache.clear()
    yield
    _login_cache.clear()


@pytest.mark.parametrize("label,method,path,body,permission,role_without,role_with,expected_status", CRUD_ENDPOINTS, ids=[row[0] for row in CRUD_ENDPOINTS])
def test_crud_endpoint_authorization(client, label, method, path, body, permission, role_without, role_with, expected_status):
    test_client, sessionmaker_ = client

    # No token at all -> 401, regardless of role/permission.
    no_token_resp = test_client.request(method, path, json=body)
    assert no_token_resp.status_code == 401, f"{label}: expected 401 with no token, got {no_token_resp.status_code}"

    # Authenticated but lacking the required permission -> 403.
    without_token = _token_for_role(test_client, sessionmaker_, role_without)
    forbidden_resp = test_client.request(method, path, json=body, headers={"Authorization": f"Bearer {without_token}"})
    assert forbidden_resp.status_code == 403, f"{label}: expected 403 for role {role_without!r}, got {forbidden_resp.status_code}"
    assert forbidden_resp.json()["error"]["code"] == "FORBIDDEN"

    # Authenticated and holding the required permission -> the endpoint's
    # existing behavior (200 for the honest-empty-list routes, 501 for
    # every not_implemented() stub) — proving authorization passed.
    with_token = _token_for_role(test_client, sessionmaker_, role_with)
    ok_resp = test_client.request(method, path, json=body, headers={"Authorization": f"Bearer {with_token}"})
    assert ok_resp.status_code == expected_status, (
        f"{label}: expected {expected_status} for role {role_with!r} (permission {permission!r}), "
        f"got {ok_resp.status_code}: {ok_resp.text}"
    )


def test_copilot_query_requires_authentication_only(client):
    test_client, sessionmaker_ = client
    body = {"question": "What is the current stock level for SKU1?"}

    no_token_resp = test_client.post("/api/v1/copilot/query", json=body)
    assert no_token_resp.status_code == 401

    # Any authenticated user, regardless of role/permissions, must reach
    # the stub — copilot has no permission requirement per design.
    token = _token_for_role(test_client, sessionmaker_, NO_PERM_ROLE)
    ok_resp = test_client.post("/api/v1/copilot/query", json=body, headers={"Authorization": f"Bearer {token}"})
    assert ok_resp.status_code == 501
