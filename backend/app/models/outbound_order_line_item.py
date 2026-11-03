from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import CheckConstraint, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.outbound_order import OutboundOrder
    from app.models.product import Product


class OutboundOrderLineItem(Base):
    __tablename__ = "outbound_order_line_items"
    __table_args__ = (
        CheckConstraint("ordered_qty > 0", name="ck_outbound_line_items_ordered_qty_positive"),
        CheckConstraint("picked_qty >= 0", name="ck_outbound_line_items_picked_qty_non_negative"),
        CheckConstraint("packed_qty >= 0", name="ck_outbound_line_items_packed_qty_non_negative"),
        # NOTE: picked_qty <= ordered_qty and packed_qty <= picked_qty are
        # intentionally NOT enforced here. Operational exceptions (e.g.
        # short-picks reconciled later, or packing adjustments) are handled
        # at the service layer once the picking/packing workflow is defined,
        # not via a database constraint. See the Stage 8 report.
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    outbound_order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("outbound_orders.id"), nullable=False, index=True
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True
    )
    ordered_qty: Mapped[int] = mapped_column(Integer, nullable=False)
    # picked_qty <= ordered_qty is a service-layer rule, not a DB constraint
    # — see the __table_args__ note above.
    picked_qty: Mapped[Optional[int]] = mapped_column(Integer)
    # packed_qty <= picked_qty is a service-layer rule, not a DB constraint
    # — see the __table_args__ note above.
    packed_qty: Mapped[Optional[int]] = mapped_column(Integer)

    outbound_order: Mapped["OutboundOrder"] = relationship(back_populates="line_items")
    product: Mapped["Product"] = relationship(back_populates="outbound_line_items")
