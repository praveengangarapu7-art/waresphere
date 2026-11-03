"""API-level tests for JWT authentication (Phase 2A): login, current-user
retrieval via bearer token, expiry/type/signature rejection, and prevention
of client-controlled role escalation at registration.

Uses FastAPI's TestClient (httpx-backed) against the real app, with
`get_db` overridden to an isolated in-memory SQLite database (shared across
requests within a test via StaticPool) — this never touches the real
DATABASE_URL. TestClient is used WITHOUT the `with ...:` context-manager
form on purpose: that form is what actually runs app.main's lifespan
handler (which calls Base.metadata.create_all against the *real* engine);
plain `TestClient(app)` does not trigger it, confirmed empirically before
writing these tests.
"""

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401  (registers every model on Base.metadata)
from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.security import ACCESS_TOKEN_TYPE

TEST_PASSWORD = "correct-horse-battery-staple"


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def _register(client, email="alice@example.com", password=TEST_PASSWORD, **extra):
    body = {"name": "Alice", "email": email, "password": password, **extra}
    return client.post("/api/v1/auth/register", json=body)


def _login(client, email="alice@example.com", password=TEST_PASSWORD):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password})


def test_register_defaults_new_users_to_staff_role(client):
    resp = _register(client)

    assert resp.status_code == 201
    body = resp.json()
    assert body["role"] == "staff"
    assert "password" not in body
    assert "password_hash" not in body


def test_register_rejects_a_client_supplied_role_field_outright(client):
    """
    RegisterRequest has no `role` field at all, so extra="forbid" rejects
    the attempt as a validation error — the client cannot even try to
    escalate its own role, not merely have the attempt silently ignored.
    """
    resp = _register(client, role="it_admin")

    assert resp.status_code == 422


def test_register_rejects_duplicate_email(client):
    first = _register(client)
    assert first.status_code == 201

    second = _register(client)
    assert second.status_code == 409


def test_successful_login_returns_bearer_tokens(client):
    _register(client)

    resp = _login(client)

    assert resp.status_code == 200
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["refresh_token"]
    assert body["expires_in"] == settings.access_token_expire_minutes * 60


def test_login_with_incorrect_password_returns_401(client):
    _register(client)

    resp = _login(client, password="wrong-password")

    assert resp.status_code == 401


def test_login_with_unknown_user_returns_401(client):
    resp = _login(client, email="nobody@example.com", password="whatever123")

    assert resp.status_code == 401


def test_me_without_bearer_token_returns_401(client):
    resp = client.get("/api/v1/auth/me")

    assert resp.status_code == 401


def test_me_with_invalid_token_returns_401(client):
    resp = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not-a-real-token"})

    assert resp.status_code == 401


def test_me_with_expired_token_returns_401(client):
    register_resp = _register(client)
    user_id = register_resp.json()["id"]

    now = datetime.now(timezone.utc)
    expired_token = jwt.encode(
        {
            "sub": user_id,
            "type": ACCESS_TOKEN_TYPE,
            "iat": now - timedelta(minutes=20),
            "exp": now - timedelta(minutes=5),
        },
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )

    resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_token}"})

    assert resp.status_code == 401


def test_me_rejects_a_refresh_token_used_as_an_access_token(client):
    """
    Access and refresh tokens are both plain signed JWTs distinguished only
    by a "type" claim — without this check, a leaked/observed refresh token
    would work as a full access token, which get_current_user must reject.
    """
    _register(client)
    login_resp = _login(client)
    refresh_token = login_resp.json()["refresh_token"]

    resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {refresh_token}"})

    assert resp.status_code == 401


def test_me_returns_the_current_authenticated_users_profile(client):
    _register(client)
    login_resp = _login(client)
    access_token = login_resp.json()["access_token"]

    resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})

    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == "alice@example.com"
    assert body["role"] == "staff"
