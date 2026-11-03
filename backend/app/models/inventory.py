from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.batch import Batch
    from app.models.bin import Bin
    from app.models.product import Product
    from app.models.warehouse import Warehouse


class Inventory(Base):
    __tablename__ = "inventory"
    __table_args__ = (
        # Stage 9: batch_id is now NOT NULL (every inventory record must
        # belong to a batch), so the only remaining NULL-uniqueness caveat
        # concerns bin_id. PostgreSQL treats each NULL as distinct for
        # uniqueness purposes, so this constraint does not prevent multiple
        # NULL-bin rows (received stock awaiting putaway) for the same
        # product+batch — that is expected and intentional, not a bug.
        UniqueConstraint("product_id", "batch_id", "bin_id", name="uq_inventory_product_batch_bin"),
        CheckConstraint("quantity >= 0", name="ck_inventory_quantity_non_negative"),
        CheckConstraint("reserved_quantity >= 0", name="ck_inventory_reserved_quantity_non_negative"),
        # NOTE: reserved_quantity <= quantity is a deliberate business rule,
        # NOT enforced here. It must be enforced in the future service layer
        # once the reservation/allocation workflow is defined, because a DB
        # CHECK constraint would reject any legitimate transient overbooking
        # state before that policy decision has even been made. See the
        # Stage 8 report.
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True
    )
    # NOT NULL as of Stage 9: every inventory record must belong to a batch.
    batch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("batches.id"), nullable=False, index=True
    )
    # Nullable: supports stock that has been received but is awaiting
    # putaway to a specific bin (see InboundOrder.status == "Putaway Pending").
    bin_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("bins.id"), index=True)
    # Nullable: warehouse can potentially be inferred via bin -> zone ->
    # warehouse, but is tracked directly here so traceability doesn't break
    # when bin_id is NULL (see above). Does not replace the bin relationship.
    warehouse_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("warehouses.id"), index=True
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # reserved_quantity <= quantity is intentionally NOT enforced at the DB
    # level yet — see the __table_args__ note above.
    reserved_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    product: Mapped["Product"] = relationship(back_populates="inventory_records")
    batch: Mapped["Batch"] = relationship(back_populates="inventory_records")
    bin: Mapped[Optional["Bin"]] = relationship(back_populates="inventory_records")
    warehouse: Mapped[Optional["Warehouse"]] = relationship(back_populates="inventory_records")
