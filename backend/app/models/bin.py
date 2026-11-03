from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.inventory import Inventory
    from app.models.stock_movement import StockMovement
    from app.models.zone import Zone


class Bin(Base):
    __tablename__ = "bins"
    __table_args__ = (
        # A bin code only needs to be unique within its own zone, not
        # globally across the whole warehouse network.
        UniqueConstraint("zone_id", "bin_code", name="uq_bins_zone_id_bin_code"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    zone_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("zones.id"), nullable=False)
    bin_code: Mapped[str] = mapped_column(String(50), nullable=False)
    capacity: Mapped[Optional[int]] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")

    zone: Mapped["Zone"] = relationship(back_populates="bins")
    inventory_records: Mapped[List["Inventory"]] = relationship(back_populates="bin")
    movements_from: Mapped[List["StockMovement"]] = relationship(
        back_populates="source_bin", foreign_keys="StockMovement.source_bin_id"
    )
    movements_to: Mapped[List["StockMovement"]] = relationship(
        back_populates="destination_bin", foreign_keys="StockMovement.destination_bin_id"
    )
