from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.batch import Batch
    from app.models.bin import Bin
    from app.models.product import Product
    from app.models.user import User
    from app.models.warehouse import Warehouse


# Canonical movement_type vocabulary, mirrored from the frontend's
# SkuMovement.type union (src/types/sku.ts). movement_type remains a plain
# database string (no PostgreSQL enum) so this list can evolve without a
# migration; it exists for future Pydantic schema / service-layer validation
# once movement-writing API endpoints are built — it is not enforced here.
MOVEMENT_TYPES: tuple[str, ...] = (
    "Receipt/GRN",
    "Putaway",
    "Pick",
    "Bin Transfer",
    "Inter-warehouse Transfer",
    "Adjustment",
    "Return",
    "Dispatch",
)


class StockMovement(Base):
    __tablename__ = "stock_movements"
    __table_args__ = (
        # A movement of zero (or negative) units isn't a movement; direction
        # is carried by movement_type, not by the sign of quantity.
        CheckConstraint("quantity > 0", name="ck_stock_movements_quantity_positive"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True
    )
    batch_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("batches.id"), index=True
    )
    source_bin_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("bins.id"))
    destination_bin_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("bins.id"))
    # Nullable: also derivable via source_bin/destination_bin -> zone ->
    # warehouse, but tracked directly because that derivation breaks down for
    # Inter-warehouse Transfer (source and destination legitimately belong to
    # two different warehouses) and whenever both bins are NULL.
    warehouse_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("warehouses.id"), index=True
    )
    # Nullable: who performed the movement. Not populated/enforced yet — no
    # authentication exists in this stage.
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    # movement_type stays a free-text string (see MOVEMENT_TYPES above); the
    # 8-value vocabulary is enforced at the service/Pydantic layer later, not
    # via a DB CHECK constraint or PostgreSQL enum.
    movement_type: Mapped[str] = mapped_column(String(50), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    reference_number: Mapped[Optional[str]] = mapped_column(String(100))
    # Free-form explanation, e.g. "Counting Variance" on an Adjustment.
    reason: Mapped[Optional[str]] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    product: Mapped["Product"] = relationship(back_populates="movements")
    batch: Mapped[Optional["Batch"]] = relationship(back_populates="movements")
    source_bin: Mapped[Optional["Bin"]] = relationship(
        back_populates="movements_from", foreign_keys=[source_bin_id]
    )
    destination_bin: Mapped[Optional["Bin"]] = relationship(
        back_populates="movements_to", foreign_keys=[destination_bin_id]
    )
    warehouse: Mapped[Optional["Warehouse"]] = relationship(back_populates="stock_movements")
    actor: Mapped[Optional["User"]] = relationship(back_populates="stock_movements")
