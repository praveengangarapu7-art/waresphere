from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.constants.roles import Role
from app.database import Base

if TYPE_CHECKING:
    from app.models.stock_movement import StockMovement


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    # Remains a free-text column (no CHECK constraint, no DB-level enum) —
    # see app/constants/roles.py for why. Default is now sourced from that
    # single definition instead of a hardcoded literal, but the value is
    # identical to before ("staff").
    role: Mapped[str] = mapped_column(String(50), nullable=False, default=Role.STAFF.value)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # No cascade: stock movement history must survive independently of the
    # user account that recorded it.
    stock_movements: Mapped[List["StockMovement"]] = relationship(back_populates="actor")
