"""Unit tests for app.authorization: get_permission_codes and
require_permission (Phase 2B). Uses a small, throwaway FastAPI app (not
app.main) so these tests exercise the dependency in isolation — full,
real-endpoint authorization coverage lives in test_endpoint_authorization.py
(Stage 4). The throwaway app registers the same HTTPException handler as
app.main so error-envelope assertions match real behavior.

All data lives in a SQLite in-memory database seeded via
app.rbac_seed.seed_rbac — no PostgreSQL connection of any kind.
"""

import pytest
from fastapi import Depends, FastAPI, HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401  (registers every model on Base.metadata)
from app.authorization import get_permission_codes, require_permission
from app.database import Base, get_db
from app.main import http_exception_handler
from app.models.user import User
from app.rbac_seed import ROLE_PERMISSIONS, seed_rbac
from app.security import create_access_token, hash_password


@pytest.fixture()
def rbac_sessionmaker():
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

    try:
        yield TestingSessionLocal
    finally:
        engine.dispose()


def _make_user(TestingSessionLocal, *, role: str, email: str) -> User:
    session = TestingSessionLocal()
    user = User(
        name="Test User",
        email=email,
        password_hash=hash_password("irrelevant-password"),
        role=role,
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    session.close()
    return user


def test_get_permission_codes_returns_the_seeded_grants_for_a_known_role(rbac_sessionmaker):
    session = rbac_sessionmaker()
    try:
        codes = get_permission_codes(session, "warehouse_manager")
        assert codes == set(ROLE_PERMISSIONS["warehouse_manager"])
    finally:
        session.close()


def test_get_permission_codes_returns_empty_set_for_an_unknown_role(rbac_sessionmaker):
    session = rbac_sessionmaker()
    try:
        assert get_permission_codes(session, "not-a-real-role") == set()
    finally:
        session.close()


@pytest.fixture()
def authz_client(rbac_sessionmaker):
    def override_get_db():
        db = rbac_sessionmaker()
        try:
            yield db
        finally:
            db.close()

    test_app = FastAPI()
    test_app.add_exception_handler(HTTPException, http_exception_handler)

    @test_app.get("/any-of")
    def _any_of(user: User = Depends(require_permission("inventory.adjust", "quality.inspect"))):
        return {"user_id": str(user.id)}

    @test_app.get("/all-of")
    def _all_of(
        user: User = Depends(require_permission("inventory.read", "inventory.adjust", mode="all")),
    ):
        return {"user_id": str(user.id)}

    test_app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(test_app), rbac_sessionmaker
    finally:
        test_app.dependency_overrides.clear()


def test_require_permission_without_bearer_token_returns_401(authz_client):
    client, _ = authz_client

    resp = client.get("/any-of")

    assert resp.status_code == 401


def test_require_permission_with_role_lacking_the_permission_returns_403(authz_client):
    client, sessionmaker_ = authz_client
    user = _make_user(sessionmaker_, role="external_auditor", email="auditor@example.com")
    token = create_access_token(user.id)

    resp = client.get("/any-of", headers={"Authorization": f"Bearer {token}"})

    assert resp.status_code == 403
    body = resp.json()
    assert body["error"]["code"] == "FORBIDDEN"
    # Generic message: a 403 must never name which permission was required.
    assert "inventory" not in body["error"]["message"].lower()
    assert "quality" not in body["error"]["message"].lower()


def test_require_permission_any_mode_passes_with_one_matching_permission(authz_client):
    client, sessionmaker_ = authz_client
    # quality_inspector holds quality.inspect but not inventory.adjust —
    # this exercises a match via the second code, not the first.
    user = _make_user(sessionmaker_, role="quality_inspector", email="inspector@example.com")
    token = create_access_token(user.id)

    resp = client.get("/any-of", headers={"Authorization": f"Bearer {token}"})

    assert resp.status_code == 200


def test_require_permission_all_mode_requires_every_code(authz_client):
    client, sessionmaker_ = authz_client
    # warehouse_manager holds both inventory.read and inventory.adjust.
    manager = _make_user(sessionmaker_, role="warehouse_manager", email="manager@example.com")
    # quality_inspector holds inventory.read but NOT inventory.adjust.
    inspector = _make_user(sessionmaker_, role="quality_inspector", email="inspector2@example.com")

    manager_resp = client.get(
        "/all-of", headers={"Authorization": f"Bearer {create_access_token(manager.id)}"}
    )
    inspector_resp = client.get(
        "/all-of", headers={"Authorization": f"Bearer {create_access_token(inspector.id)}"}
    )

    assert manager_resp.status_code == 200
    assert inspector_resp.status_code == 403


def test_require_permission_fails_closed_for_a_role_with_no_seeded_permissions(authz_client):
    client, sessionmaker_ = authz_client
    user = _make_user(sessionmaker_, role="not-a-real-role", email="ghost@example.com")
    token = create_access_token(user.id)

    resp = client.get("/any-of", headers={"Authorization": f"Bearer {token}"})

    assert resp.status_code == 403
