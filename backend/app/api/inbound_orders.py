import uuid
from typing import Optional

from fastapi import APIRouter, Depends

from app.authorization import require_permission
from app.dependencies import get_pagination, not_implemented
from app.models.user import User
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.inbound_order import (
    InboundOrderCreate,
    InboundOrderLineItemCreate,
    InboundOrderLineItemRead,
    InboundOrderRead,
    InboundOrderReceiveRequest,
    InboundOrderUpdate,
)

router = APIRouter(prefix="/inbound-orders", tags=["inbound-orders"])


@router.get("", response_model=PaginatedResponse[InboundOrderRead])
def list_inbound_orders(
    pagination: PaginationParams = Depends(get_pagination),
    warehouse_id: Optional[uuid.UUID] = None,
    supplier_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    current_user: User = Depends(require_permission("orders.read")),
) -> PaginatedResponse[InboundOrderRead]:
    """Not yet backed by the database — returns an honestly empty result set."""
    return PaginatedResponse(items=[], total=0, limit=pagination.limit, offset=pagination.offset)


@router.post("", response_model=InboundOrderRead, status_code=201)
def create_inbound_order(
    payload: InboundOrderCreate,
    current_user: User = Depends(require_permission("orders.manage")),
) -> InboundOrderRead:
    """Order + line items must be created together in one transaction."""
    not_implemented("Inbound order creation is not implemented yet.")


@router.get("/{order_id}", response_model=InboundOrderRead)
def get_inbound_order(
    order_id: uuid.UUID,
    current_user: User = Depends(require_permission("orders.read")),
) -> InboundOrderRead:
    not_implemented("Fetching an inbound order by id is not implemented yet.")


@router.patch("/{order_id}", response_model=InboundOrderRead)
def update_inbound_order(
    order_id: uuid.UUID,
    payload: InboundOrderUpdate,
    current_user: User = Depends(require_permission("orders.manage")),
) -> InboundOrderRead:
    """Status transitions must eventually be validated against an explicit state machine."""
    not_implemented("Inbound order update is not implemented yet.")


@router.delete("/{order_id}", status_code=204)
def delete_inbound_order(
    order_id: uuid.UUID,
    current_user: User = Depends(require_permission("orders.manage")),
) -> None:
    """Must eventually be blocked (409) once anything has been received."""
    not_implemented("Inbound order deletion is not implemented yet.")


@router.post(
    "/{order_id}/line-items",
    response_model=InboundOrderLineItemRead,
    status_code=201,
)
def add_inbound_order_line_item(
    order_id: uuid.UUID,
    payload: InboundOrderLineItemCreate,
    current_user: User = Depends(require_permission("orders.manage")),
) -> InboundOrderLineItemRead:
    not_implemented("Adding an inbound order line item is not implemented yet.")


@router.post("/{order_id}/receive", response_model=InboundOrderRead)
def receive_inbound_order(
    order_id: uuid.UUID,
    payload: InboundOrderReceiveRequest,
    current_user: User = Depends(require_permission("orders.fulfill")),
) -> InboundOrderRead:
    """
    Dedicated receiving action: records received_qty/quality_status/
    reject_reason per line item. Gated on orders.fulfill, not orders.manage
    — per app.rbac_seed's own permission description, orders.fulfill covers
    "receiving, picking, and packing progress" specifically.
    """
    not_implemented("Receiving an inbound order is not implemented yet.")
