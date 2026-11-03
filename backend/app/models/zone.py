from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, List

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.bin import Bin
    from app.models.warehouse import Warehouse


class Zone(Base):
    __tablename__ = "zones"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    warehouse_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    zone_type: Mapped[str] = mapped_column(String(50), nullable=False, default="general")

    warehouse: Mapped["Warehouse"] = relationship(back_populates="zones")
    bins: Mapped[List["Bin"]] = relationship(back_populates="zone", cascade="all, delete-orphan")
