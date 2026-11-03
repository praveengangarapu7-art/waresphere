import uuid
from typing import NoReturn, Optional

from fastapi import Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.common import PaginationParams
from app.security import ACCESS_TOKEN_TYPE, TokenError, decode_token

# auto_error=False so a missing Authorization header reaches get_current_user
# as `None` (producing our own {"error": {...}} envelope) instead of
# FastAPI/Starlette's default {"detail": "Not authenticated"} shape.
_bearer_scheme = HTTPBearer(auto_error=False)


def get_pagination(
    limit: int = Query(default=20, ge=1, le=100, description="Max items to return"),
    offset: int = Query(default=0, ge=0, description="Number of items to skip"),
) -> PaginationParams:
    """Shared pagination dependency used by every list endpoint."""
    return PaginationParams(limit=limit, offset=offset)


def _unauthorized(message: str) -> HTTPException:
    return HTTPException(
        status_code=401,
        detail={"error": {"code": "UNAUTHORIZED", "message": message}},
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Decode the bearer access token and load the corresponding, active user.

    Raises HTTP 401 for a missing bearer token, an invalid/expired/
    wrong-type token, or a token whose subject no longer matches an active
    user — deliberately with the same generic message in every case, so a
    401 response cannot be used to distinguish "no token", "bad token", and
    "token for a deleted/deactivated user".
    """
    if credentials is None:
        raise _unauthorized("Missing bearer token.")

    try:
        user_id = decode_token(credentials.credentials, expected_type=ACCESS_TOKEN_TYPE)
    except TokenError:
        raise _unauthorized("Invalid or expired token.")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise _unauthorized("Invalid or expired token.")

    return user


def get_current_user_id(current_user: User = Depends(get_current_user)) -> uuid.UUID:
    """
    Resolves the authenticated user's id from a validated bearer token (see
    get_current_user). Any endpoint depending on this now requires a valid
    access token and raises 401 without one — before Phase 2A this always
    returned None unconditionally, since no authentication existed yet. See
    app/api/stock_movements.py for the one existing call site this changes.

    This performs authentication only — resolving *who* is calling — not
    authorization (*what* they're allowed to do). Permission/role checks on
    top of this are explicitly out of scope for Phase 2A.
    """
    return current_user.id


def not_implemented(message: str = "This endpoint is not implemented yet.") -> NoReturn:
    """
    Raises a 501 using the shared error envelope (see app.schemas.common.ErrorResponse)
    for routes that are wired up but not yet backed by real business logic.
    """
    raise HTTPException(
        status_code=501,
        detail={"error": {"code": "NOT_IMPLEMENTED", "message": message}},
    )
