import uuid
from typing import Optional

from fastapi import APIRouter, Depends

from app.authorization import require_permission
from app.dependencies import get_pagination, not_implemented
from app.models.user import User
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.warehouse import WarehouseCreate, WarehouseRead, WarehouseUpdate

router = APIRouter(prefix="/warehouses", tags=["warehouses"])


@router.get("", response_model=PaginatedResponse[WarehouseRead])
def list_warehouses(
    pagination: PaginationParams = Depends(get_pagination),
    status: Optional[str] = None,
    state: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_permission("warehouse.read")),
) -> PaginatedResponse[WarehouseRead]:
    """
    Not yet backed by the database — returns an honestly empty result set
    rather than fabricated warehouse data.
    """
    return PaginatedResponse(items=[], total=0, limit=pagination.limit, offset=pagination.offset)


@router.post("", response_model=WarehouseRead, status_code=201)
def create_warehouse(
    payload: WarehouseCreate,
    current_user: User = Depends(require_permission("warehouse.manage")),
) -> WarehouseRead:
    not_implemented("Warehouse creation is not implemented yet.")


@router.get("/{warehouse_id}", response_model=WarehouseRead)
def get_warehouse(
    warehouse_id: uuid.UUID,
    current_user: User = Depends(require_permission("warehouse.read")),
) -> WarehouseRead:
    not_implemented("Fetching a warehouse by id is not implemented yet.")


@router.patch("/{warehouse_id}", response_model=WarehouseRead)
def update_warehouse(
    warehouse_id: uuid.UUID,
    payload: WarehouseUpdate,
    current_user: User = Depends(require_permission("warehouse.manage")),
) -> WarehouseRead:
    not_implemented("Warehouse update is not implemented yet.")


@router.delete("/{warehouse_id}", status_code=204)
def delete_warehouse(
    warehouse_id: uuid.UUID,
    current_user: User = Depends(require_permission("warehouse.manage")),
) -> None:
    """
    Must eventually be blocked (409) while any zones/orders/inventory/
    movements reference this warehouse — see the Stage 10 design report.
    """
    not_implemented("Warehouse deletion is not implemented yet.")
