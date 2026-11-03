"""RBAC authorization enforcement (Phase 2B).

Resolves a user's permissions with a fresh database lookup on every
request — deliberately not embedded in the JWT — so a role or permission
change takes effect on the user's very next request rather than waiting
for the current access token to expire.

Deny-by-default throughout: an unknown/unseeded role name resolves to an
empty permission set (never raises, never grants), and require_permission
raises a generic 403 that never reveals which specific permission was
missing to a caller who doesn't hold it.
"""

from __future__ import annotations

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.user import User


def get_permission_codes(db: Session, role_name: str) -> set[str]:
    """
    The set of permission codes granted to `role_name`, via
    Role.name == role_name -> RolePermission -> Permission.code.

    Returns an empty set — never raises — if `role_name` doesn't match any
    row in the `roles` table (e.g. RBAC tables were never seeded in this
    environment, or the role was renamed/removed). Fail-closed: an unknown
    role grants nothing.
    """
    codes = (
        db.query(Permission.code)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(Role, Role.id == RolePermission.role_id)
        .filter(Role.name == role_name)
        .all()
    )
    return {code for (code,) in codes}


def _forbidden() -> HTTPException:
    # Deliberately generic: never names the permission that was required,
    # so a 403 response cannot be used to enumerate what other roles can do.
    return HTTPException(
        status_code=403,
        detail={"error": {"code": "FORBIDDEN", "message": "You do not have permission to perform this action."}},
    )


def require_permission(*codes: str, mode: str = "any"):
    """
    FastAPI dependency factory. The returned dependency depends on
    get_current_user (so it also enforces authentication — 401 for a
    missing/invalid/expired token — before authorization is even
    evaluated) and raises 403 if the current user's role does not grant
    the required permission code(s).

    mode="any" (default): at least one of `codes` must be granted.
    mode="all": every one of `codes` must be granted.

    Returns the authenticated User on success, so route handlers can still
    use it (e.g. to attribute an action to its actor).
    """
    if not codes:
        raise ValueError("require_permission() needs at least one permission code")
    if mode not in ("any", "all"):
        raise ValueError(f"require_permission(): invalid mode {mode!r}, expected 'any' or 'all'")

    def _dependency(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        granted = get_permission_codes(db, current_user.role)
        required = set(codes)
        satisfied = required.issubset(granted) if mode == "all" else bool(required & granted)
        if not satisfied:
            raise _forbidden()
        return current_user

    return _dependency
