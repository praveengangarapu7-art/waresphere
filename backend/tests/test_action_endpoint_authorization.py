"""Authorization and schema-validation tests for the three Stage 2
dedicated action endpoints:

  - POST /api/v1/batches/{id}/inspect        (quality.inspect)
  - POST /api/v1/inbound-orders/{id}/receive (orders.fulfill)
  - POST /api/v1/outbound-orders/{id}/fulfill (orders.fulfill)

All three remain safe 501 stubs — these tests confirm authorization runs
(and can 401/403) before that stub is ever reached, not any business
logic. Same pattern as test_auth_api.py: real app.main.app, get_db
overridden to an isolated in-memory SQLite database (StaticPool), seeded
via seed_rbac(); no PostgreSQL connection of any kind.
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
from app.rbac_seed import seed_rbac
from app.security import hash_password

TEST_PASSWORD = "correct-horse-battery-staple"
ARBITRARY_ID = uuid.uuid4()


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


def _make_user_and_login(client, sessionmaker_, *, role: str, email: str) -> str:
    """Inserts a user with an arbitrary role directly into the test
    database (bypassing /auth/register, which always forces "staff"), then
    logs in through the real /auth/login endpoint to obtain a real access
    token."""
    from app.models.user import User

    session = sessionmaker_()
    user = User(
        name="Test User",
        email=email,
        password_hash=hash_password(TEST_PASSWORD),
        role=role,
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.close()

    login_resp = client.post("/api/v1/auth/login", json={"email": email, "password": TEST_PASSWORD})
    assert login_resp.status_code == 200, login_resp.text
    return login_resp.json()["access_token"]


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# POST /batches/{id}/inspect  (quality.inspect)
# ---------------------------------------------------------------------------

BATCH_INSPECT_URL = f"/api/v1/batches/{ARBITRARY_ID}/inspect"
VALID_INSPECT_BODY = {"status": "accepted"}


def test_inspect_batch_without_token_returns_401(client):
    test_client, _ = client
    resp = test_client.post(BATCH_INSPECT_URL, json=VALID_INSPECT_BODY)
    assert resp.status_code == 401


def test_inspect_batch_without_quality_inspect_permission_returns_403(client):
    test_client, sessionmaker_ = client
    token = _make_user_and_login(test_client, sessionmaker_, role="staff", email="staff1@example.com")

    resp = test_client.post(BATCH_INSPECT_URL, json=VALID_INSPECT_BODY, headers=_auth_headers(token))

    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "FORBIDDEN"


def test_inspect_batch_with_quality_inspect_permission_reaches_the_stub(client):
    test_client, sessionmaker_ = client
    token = _make_user_and_login(
        test_client, sessionmaker_, role="quality_inspector", email="inspector@example.com"
    )

    resp = test_client.post(BATCH_INSPECT_URL, json=VALID_INSPECT_BODY, headers=_auth_headers(token))

    assert resp.status_code == 501


def test_inspect_batch_rejects_unexpected_fields(client):
    test_client, sessionmaker_ = client
    token = _make_user_and_login(
        test_client, sessionmaker_, role="quality_inspector", email="inspector2@example.com"
    )

    resp = test_client.post(
        BATCH_INSPECT_URL,
        json={"status": "accepted", "manufacturing_date": "2026-01-01"},
        headers=_auth_headers(token),
    )

    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# POST /inbound-orders/{id}/receive  (orders.fulfill)
# ---------------------------------------------------------------------------

INBOUND_RECEIVE_URL = f"/api/v1/inbound-orders/{ARBITRARY_ID}/receive"
VALID_RECEIVE_BODY = {
    "line_items": [
        {"line_item_id": str(uuid.uuid4()), "received_qty": 10, "quality_status": "accepted"}
    ]
}


def test_receive_inbound_order_without_token_returns_401(client):
    test_client, _ = client
    resp = test_client.post(INBOUND_RECEIVE_URL, json=VALID_RECEIVE_BODY)
    assert resp.status_code == 401


def test_receive_inbound_order_without_orders_fulfill_permission_returns_403(client):
    test_client, sessionmaker_ = client
    token = _make_user_and_login(test_client, sessionmaker_, role="director", email="director@example.com")

    resp = test_client.post(INBOUND_RECEIVE_URL, json=VALID_RECEIVE_BODY, headers=_auth_headers(token))

    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "FORBIDDEN"


@pytest.mark.parametrize("role", ["staff", "warehouse_manager", "warehouse_supervisor"])
def test_receive_inbound_order_with_orders_fulfill_permission_reaches_the_stub(client, role):
    test_client, sessionmaker_ = client
    token = _make_user_and_login(test_client, sessionmaker_, role=role, email=f"{role}@example.com")

    resp = test_client.post(INBOUND_RECEIVE_URL, json=VALID_RECEIVE_BODY, headers=_auth_headers(token))

    assert resp.status_code == 501


def test_receive_inbound_order_rejects_unexpected_fields(client):
    test_client, sessionmaker_ = client
    token = _make_user_and_login(test_client, sessionmaker_, role="staff", email="staff2@example.com")

    resp = test_client.post(
        INBOUND_RECEIVE_URL,
        json={"line_items": [], "supplier_id": str(uuid.uuid4())},
        headers=_auth_headers(token),
    )

    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# POST /outbound-orders/{id}/fulfill  (orders.fulfill)
# ---------------------------------------------------------------------------

OUTBOUND_FULFILL_URL = f"/api/v1/outbound-orders/{ARBITRARY_ID}/fulfill"
VALID_FULFILL_BODY = {
    "line_items": [{"line_item_id": str(uuid.uuid4()), "picked_qty": 5, "packed_qty": 5}]
}


def test_fulfill_outbound_order_without_token_returns_401(client):
    test_client, _ = client
    resp = test_client.post(OUTBOUND_FULFILL_URL, json=VALID_FULFILL_BODY)
    assert resp.status_code == 401


def test_fulfill_outbound_order_without_orders_fulfill_permission_returns_403(client):
    test_client, sessionmaker_ = client
    token = _make_user_and_login(
        test_client, sessionmaker_, role="inventory_controller", email="controller@example.com"
    )

    resp = test_client.post(OUTBOUND_FULFILL_URL, json=VALID_FULFILL_BODY, headers=_auth_headers(token))

    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "FORBIDDEN"


def test_fulfill_outbound_order_with_orders_fulfill_permission_reaches_the_stub(client):
    test_client, sessionmaker_ = client
    token = _make_user_and_login(
        test_client, sessionmaker_, role="warehouse_supervisor", email="supervisor@example.com"
    )

    resp = test_client.post(OUTBOUND_FULFILL_URL, json=VALID_FULFILL_BODY, headers=_auth_headers(token))

    assert resp.status_code == 501


def test_fulfill_outbound_order_rejects_unexpected_fields(client):
    test_client, sessionmaker_ = client
    token = _make_user_and_login(
        test_client, sessionmaker_, role="warehouse_supervisor", email="supervisor2@example.com"
    )

    resp = test_client.post(
        OUTBOUND_FULFILL_URL,
        json={"line_items": [], "customer_name": "Acme"},
        headers=_auth_headers(token),
    )

    assert resp.status_code == 422
