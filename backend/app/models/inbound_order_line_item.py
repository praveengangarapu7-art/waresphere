from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.inbound_order import InboundOrder
    from app.models.product import Product


class InboundOrderLineItem(Base):
    __tablename__ = "inbound_order_line_items"
    __table_args__ = (
        CheckConstraint("expected_qty >= 0", name="ck_inbound_line_items_expected_qty_non_negative"),
        CheckConstraint("received_qty >= 0", name="ck_inbound_line_items_received_qty_non_negative"),
        # NOTE: received_qty <= expected_qty is intentionally NOT enforced
        # here. Over-receiving (supplier ships more than the PO'd quantity)
        # is a legitimate operational scenario, so this is a service-layer
        # business rule to apply once the receiving workflow is defined, not
        # a database constraint. See the Stage 8 report.
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inbound_order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("inbound_orders.id"), nullable=False, index=True
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True
    )
    expected_qty: Mapped[int] = mapped_column(Integer, nullable=False)
    # received_qty <= expected_qty is a service-layer rule, not a DB
    # constraint — see the __table_args__ note above.
    received_qty: Mapped[Optional[int]] = mapped_column(Integer)
    quality_status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    reject_reason: Mapped[Optional[str]] = mapped_column(String(255))

    inbound_order: Mapped["InboundOrder"] = relationship(back_populates="line_items")
    product: Mapped["Product"] = relationship(back_populates="inbound_line_items")
