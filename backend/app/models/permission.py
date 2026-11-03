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


class Permission(Base):
    """
    A single, granular, normalized permission identifier, e.g.
    "inventory.read". `category` groups permissions by resource area
    (inventory, warehouse, products, batches, quality, orders, movements,
    transfers, reports, compliance, users, system — see app.rbac_seed for
    the full definitions) without requiring callers to parse the `code`
    string.
    """

    __tablename__ = "permissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    role_permissions: Mapped[List["RolePermission"]] = relationship(
        back_populates="permission", cascade="all, delete-orphan"
    )
