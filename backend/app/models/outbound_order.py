from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Date, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.outbound_order_line_item import OutboundOrderLineItem
    from app.models.warehouse import Warehouse


class OutboundOrder(Base):
    __tablename__ = "outbound_orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    warehouse_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    customer_name: Mapped[Optional[str]] = mapped_column(String(255))
    dispatch_date: Mapped[Optional[date]] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    warehouse: Mapped["Warehouse"] = relationship(back_populates="outbound_orders")
    line_items: Mapped[List["OutboundOrderLineItem"]] = relationship(
        back_populates="outbound_order", cascade="all, delete-orphan"
    )
