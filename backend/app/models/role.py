from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.role_permission import RolePermission


class Role(Base):
    """
    A normalized, database-backed role definition — the RBAC foundation
    introduced in Phase 1.

    This is intentionally NOT yet linked to User.role (still a free-text
    string column, unchanged) or to the legacy app.constants.roles.Role
    enum (STAFF/DIRECTOR, also unchanged). Wiring an actual user account to
    one of these rows — and enforcing anything based on it — is deferred to
    a later phase, once authentication/authorization middleware exists.
    See the Phase 1 report for the full rationale.
    """

    __tablename__ = "roles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    role_permissions: Mapped[List["RolePermission"]] = relationship(
        back_populates="role", cascade="all, delete-orphan"
    )
