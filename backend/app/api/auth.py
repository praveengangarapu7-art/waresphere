from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.constants.roles import Role
from app.database import get_db
from app.dependencies import get_current_user, not_implemented
from app.models.user import User
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse, UserRead
from app.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    validate_and_normalize_email,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _invalid_credentials() -> HTTPException:
    # Same message and status for "unknown email", "wrong password", and
    # "inactive account" — a 401 here must not let a caller enumerate which
    # emails are registered.
    return HTTPException(
        status_code=401,
        detail={"error": {"code": "UNAUTHORIZED", "message": "Incorrect email or password."}},
    )


@router.post("/register", response_model=UserRead, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> UserRead:
    """
    Public self-registration. RegisterRequest carries no `role` field at
    all, so a client cannot submit one — every user created here always
    gets the default staff role. Changing a user's role to anything else
    requires a future authorized-administrator endpoint (not implemented in
    Phase 2A — see the phase report for this and other known limitations).
    """
    try:
        normalized_email = validate_and_normalize_email(payload.email)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail={"error": {"code": "VALIDATION_ERROR", "message": str(exc)}},
        ) from exc

    user = User(
        name=payload.name,
        email=normalized_email,
        password_hash=hash_password(payload.password),
        role=Role.STAFF.value,
        is_active=True,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail={"error": {"code": "CONFLICT", "message": "A user with this email already exists."}},
        ) from exc
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    normalized_email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise _invalid_credentials()

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest) -> TokenResponse:
    """
    Not implemented yet. login already issues a refresh_token (a longer-
    lived signed JWT) to satisfy the existing TokenResponse contract, but
    there is deliberately no server-side store for it yet, so it cannot be
    rotated, revoked, or redeemed here — see the Phase 2A report for this
    tradeoff. Do not build rotation/revocation here until that is scoped.
    """
    not_implemented("Token refresh is not implemented yet.")


@router.post("/logout", status_code=204)
def logout() -> None:
    """Not implemented yet — there is no server-side refresh-token store to revoke against."""
    not_implemented("Logout is not implemented yet.")


@router.get("/me", response_model=UserRead)
def get_current_user_profile(current_user: User = Depends(get_current_user)) -> UserRead:
    return current_user
