from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Date, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.inbound_order_line_item import InboundOrderLineItem
    from app.models.supplier import Supplier
    from app.models.warehouse import Warehouse


class InboundOrder(Base):
    __tablename__ = "inbound_orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    supplier_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("suppliers.id"))
    warehouse_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    expected_date: Mapped[Optional[date]] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    supplier: Mapped[Optional["Supplier"]] = relationship(back_populates="inbound_orders")
    warehouse: Mapped["Warehouse"] = relationship(back_populates="inbound_orders")
    line_items: Mapped[List["InboundOrderLineItem"]] = relationship(
        back_populates="inbound_order", cascade="all, delete-orphan"
    )
