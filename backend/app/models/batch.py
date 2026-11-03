from __future__ import annotations

import uuid
from datetime import date
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Date, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.inventory import Inventory
    from app.models.product import Product
    from app.models.stock_movement import StockMovement


class Batch(Base):
    __tablename__ = "batches"
    __table_args__ = (
        # A batch number only needs to be unique within its own product's
        # batches, not globally across all products.
        UniqueConstraint("product_id", "batch_number", name="uq_batches_product_id_batch_number"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    batch_number: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    manufacturing_date: Mapped[Optional[date]] = mapped_column(Date)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="accepted")

    product: Mapped["Product"] = relationship(back_populates="batches")
    inventory_records: Mapped[List["Inventory"]] = relationship(back_populates="batch")
    movements: Mapped[List["StockMovement"]] = relationship(back_populates="batch")
