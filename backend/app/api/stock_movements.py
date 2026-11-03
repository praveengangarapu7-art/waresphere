import uuid
from typing import Optional

from fastapi import APIRouter, Depends

from app.authorization import require_permission
from app.dependencies import get_current_user_id, get_pagination, not_implemented
from app.models.user import User
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.stock_movement import StockMovementCreate, StockMovementRead

router = APIRouter(prefix="/stock-movements", tags=["stock-movements"])

# Deliberately no PUT/PATCH/DELETE on this resource: stock_movements is an
# append-only audit ledger. Corrections happen via a new compensating
# movement (e.g. a reversing Adjustment), never by editing history.


@router.get("", response_model=PaginatedResponse[StockMovementRead])
def list_stock_movements(
    pagination: PaginationParams = Depends(get_pagination),
    product_id: Optional[uuid.UUID] = None,
    batch_id: Optional[uuid.UUID] = None,
    warehouse_id: Optional[uuid.UUID] = None,
    movement_type: Optional[str] = None,
    actor_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(require_permission("movements.read")),
) -> PaginatedResponse[StockMovementRead]:
    """Not yet backed by the database — returns an honestly empty result set."""
    return PaginatedResponse(items=[], total=0, limit=pagination.limit, offset=pagination.offset)


@router.get("/{movement_id}", response_model=StockMovementRead)
def get_stock_movement(
    movement_id: uuid.UUID,
    current_user: User = Depends(require_permission("movements.read")),
) -> StockMovementRead:
    not_implemented("Fetching a stock movement by id is not implemented yet.")


@router.post("", response_model=StockMovementRead, status_code=201)
def create_stock_movement(
    payload: StockMovementCreate,
    current_user_id: uuid.UUID = Depends(get_current_user_id),
    _authorized: User = Depends(require_permission("movements.create")),
) -> StockMovementRead:
    """
    actor_id is taken from get_current_user_id (the authenticated user),
    never from the request body — StockMovementCreate has no actor_id field
    at all. get_current_user_id and require_permission both depend on
    get_current_user internally; FastAPI resolves that shared dependency
    once per request, so authentication is not performed twice.

    Not implemented yet: writing this row and applying the corresponding
    Inventory update(s) must happen in one transaction with row-level
    locking — see the Stage 10 design report.
    """
    not_implemented("Recording a stock movement is not implemented yet.")
