import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class InboundOrderLineItemBase(BaseModel):
    product_id: uuid.UUID
    expected_qty: int = Field(ge=0)
    received_qty: Optional[int] = Field(default=None, ge=0)
    quality_status: str = "pending"
    reject_reason: Optional[str] = None

    # received_qty <= expected_qty is intentionally NOT validated here.
    # Over-receiving is a legitimate operational scenario (Stage 9 approved
    # decision) — this is a future service-layer business rule, not a
    # schema-level constraint.


class InboundOrderLineItemCreate(InboundOrderLineItemBase):
    model_config = ConfigDict(extra="forbid")


class InboundOrderLineItemRead(InboundOrderLineItemBase):
    id: uuid.UUID
    inbound_order_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)


class InboundOrderBase(BaseModel):
    order_number: str
    supplier_id: Optional[uuid.UUID] = None
    warehouse_id: uuid.UUID
    status: str = "pending"
    expected_date: Optional[date] = None


class InboundOrderCreate(InboundOrderBase):
    line_items: List[InboundOrderLineItemCreate] = Field(default_factory=list)

    model_config = ConfigDict(extra="forbid")


class InboundOrderUpdate(BaseModel):
    status: Optional[str] = None
    expected_date: Optional[date] = None

    model_config = ConfigDict(extra="forbid")


class InboundOrderRead(InboundOrderBase):
    id: uuid.UUID
    created_at: datetime
    line_items: List[InboundOrderLineItemRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class InboundOrderReceiveLineItem(BaseModel):
    """One line item's receiving progress, recorded via POST
    /inbound-orders/{id}/receive (orders.fulfill permission)."""

    line_item_id: uuid.UUID
    received_qty: int = Field(ge=0)
    quality_status: Optional[str] = None
    reject_reason: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class InboundOrderReceiveRequest(BaseModel):
    line_items: List[InboundOrderReceiveLineItem] = Field(default_factory=list)

    model_config = ConfigDict(extra="forbid")
