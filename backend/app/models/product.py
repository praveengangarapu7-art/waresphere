from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.batch import Batch
    from app.models.inbound_order_line_item import InboundOrderLineItem
    from app.models.inventory import Inventory
    from app.models.outbound_order_line_item import OutboundOrderLineItem
    from app.models.stock_movement import StockMovement


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sku_code: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100))
    unit: Mapped[str] = mapped_column(String(50), nullable=False, default="units")
    reorder_point: Mapped[int] = mapped_column(default=0)
    safety_stock: Mapped[int] = mapped_column(default=0)
    unit_cost: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    batches: Mapped[List["Batch"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    inventory_records: Mapped[List["Inventory"]] = relationship(back_populates="product")
    movements: Mapped[List["StockMovement"]] = relationship(back_populates="product")
    inbound_line_items: Mapped[List["InboundOrderLineItem"]] = relationship(back_populates="product")
    outbound_line_items: Mapped[List["OutboundOrderLineItem"]] = relationship(back_populates="product")
