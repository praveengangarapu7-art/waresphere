from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.inbound_order import InboundOrder
    from app.models.inventory import Inventory
    from app.models.outbound_order import OutboundOrder
    from app.models.stock_movement import StockMovement
    from app.models.zone import Zone


class Warehouse(Base):
    __tablename__ = "warehouses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    address: Mapped[Optional[str]] = mapped_column(String(500))
    city: Mapped[Optional[str]] = mapped_column(String(100))
    state: Mapped[Optional[str]] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    zones: Mapped[List["Zone"]] = relationship(back_populates="warehouse", cascade="all, delete-orphan")
    inbound_orders: Mapped[List["InboundOrder"]] = relationship(back_populates="warehouse")
    outbound_orders: Mapped[List["OutboundOrder"]] = relationship(back_populates="warehouse")
    # No cascade on these two: inventory/movement history is operational
    # record-keeping, not data owned exclusively by the warehouse row.
    inventory_records: Mapped[List["Inventory"]] = relationship(back_populates="warehouse")
    stock_movements: Mapped[List["StockMovement"]] = relationship(back_populates="warehouse")
