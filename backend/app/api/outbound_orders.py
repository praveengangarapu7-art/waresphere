import uuid
from typing import Optional

from fastapi import APIRouter, Depends

from app.authorization import require_permission
from app.dependencies import get_pagination, not_implemented
from app.models.user import User
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.outbound_order import (
    OutboundOrderCreate,
    OutboundOrderFulfillRequest,
    OutboundOrderLineItemCreate,
    OutboundOrderLineItemRead,
    OutboundOrderRead,
    OutboundOrderUpdate,
)

router = APIRouter(prefix="/outbound-orders", tags=["outbound-orders"])


@router.get("", response_model=PaginatedResponse[OutboundOrderRead])
def list_outbound_orders(
    pagination: PaginationParams = Depends(get_pagination),
    warehouse_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    customer_name: Optional[str] = None,
    current_user: User = Depends(require_permission("orders.read")),
) -> PaginatedResponse[OutboundOrderRead]:
    """Not yet backed by the database — returns an honestly empty result set."""
    return PaginatedResponse(items=[], total=0, limit=pagination.limit, offset=pagination.offset)


@router.post("", response_model=OutboundOrderRead, status_code=201)
def create_outbound_order(
    payload: OutboundOrderCreate,
    current_user: User = Depends(require_permission("orders.manage")),
) -> OutboundOrderRead:
    """Order + line items must be created together in one transaction."""
    not_implemented("Outbound order creation is not implemented yet.")


@router.get("/{order_id}", response_model=OutboundOrderRead)
def get_outbound_order(
    order_id: uuid.UUID,
    current_user: User = Depends(require_permission("orders.read")),
) -> OutboundOrderRead:
    not_implemented("Fetching an outbound order by id is not implemented yet.")


@router.patch("/{order_id}", response_model=OutboundOrderRead)
def update_outbound_order(
    order_id: uuid.UUID,
    payload: OutboundOrderUpdate,
    current_user: User = Depends(require_permission("orders.manage")),
) -> OutboundOrderRead:
    """Status transitions must eventually be validated against an explicit state machine."""
    not_implemented("Outbound order update is not implemented yet.")


@router.delete("/{order_id}", status_code=204)
def delete_outbound_order(
    order_id: uuid.UUID,
    current_user: User = Depends(require_permission("orders.manage")),
) -> None:
    """Must eventually be blocked (409) once anything has been picked."""
    not_implemented("Outbound order deletion is not implemented yet.")


@router.post(
    "/{order_id}/line-items",
    response_model=OutboundOrderLineItemRead,
    status_code=201,
)
def add_outbound_order_line_item(
    order_id: uuid.UUID,
    payload: OutboundOrderLineItemCreate,
    current_user: User = Depends(require_permission("orders.manage")),
) -> OutboundOrderLineItemRead:
    not_implemented("Adding an outbound order line item is not implemented yet.")


@router.post("/{order_id}/fulfill", response_model=OutboundOrderRead)
def fulfill_outbound_order(
    order_id: uuid.UUID,
    payload: OutboundOrderFulfillRequest,
    current_user: User = Depends(require_permission("orders.fulfill")),
) -> OutboundOrderRead:
    """Dedicated picking/packing-progress action, gated on orders.fulfill."""
    not_implemented("Fulfilling an outbound order is not implemented yet.")
