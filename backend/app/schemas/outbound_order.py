import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class OutboundOrderLineItemBase(BaseModel):
    product_id: uuid.UUID
    ordered_qty: int = Field(gt=0)
    picked_qty: Optional[int] = Field(default=None, ge=0)
    packed_qty: Optional[int] = Field(default=None, ge=0)

    # picked_qty <= ordered_qty and packed_qty <= picked_qty are
    # intentionally NOT validated here — operational exceptions are a
    # future service-layer business rule (Stage 9 approved decision), not a
    # schema-level constraint.


class OutboundOrderLineItemCreate(OutboundOrderLineItemBase):
    model_config = ConfigDict(extra="forbid")


class OutboundOrderLineItemRead(OutboundOrderLineItemBase):
    id: uuid.UUID
    outbound_order_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)


class OutboundOrderBase(BaseModel):
    order_number: str
    warehouse_id: uuid.UUID
    status: str = "pending"
    customer_name: Optional[str] = None
    dispatch_date: Optional[date] = None


class OutboundOrderCreate(OutboundOrderBase):
    line_items: List[OutboundOrderLineItemCreate] = Field(default_factory=list)

    model_config = ConfigDict(extra="forbid")


class OutboundOrderUpdate(BaseModel):
    status: Optional[str] = None
    customer_name: Optional[str] = None
    dispatch_date: Optional[date] = None

    model_config = ConfigDict(extra="forbid")


class OutboundOrderRead(OutboundOrderBase):
    id: uuid.UUID
    created_at: datetime
    line_items: List[OutboundOrderLineItemRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class OutboundOrderFulfillLineItem(BaseModel):
    """One line item's picking/packing progress, recorded via POST
    /outbound-orders/{id}/fulfill (orders.fulfill permission)."""

    line_item_id: uuid.UUID
    picked_qty: Optional[int] = Field(default=None, ge=0)
    packed_qty: Optional[int] = Field(default=None, ge=0)

    model_config = ConfigDict(extra="forbid")


class OutboundOrderFulfillRequest(BaseModel):
    line_items: List[OutboundOrderFulfillLineItem] = Field(default_factory=list)

    model_config = ConfigDict(extra="forbid")
