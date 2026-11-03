import uuid
from typing import Optional

from fastapi import APIRouter, Depends

from app.authorization import require_permission
from app.dependencies import get_pagination, not_implemented
from app.models.user import User
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.inventory import (
    InventoryAdjustRequest,
    InventoryCreate,
    InventoryRead,
    InventoryReleaseRequest,
    InventoryReserveRequest,
    InventoryUpdate,
)

router = APIRouter(prefix="/inventory", tags=["inventory"])

# TEMPORARY FALLBACK (Phase 2B Stage 3): direct create/update/delete on this
# resource don't precisely fit either inventory permission — inventory.adjust
# is seeded specifically as "Perform inventory quantity corrections", but
# creation, bin/warehouse relocation (the only fields InventoryUpdate allows
# — see update_inventory below), and deletion aren't quantity corrections.
# inventory.adjust is used here anyway as the closest/broadest available
# inventory-write permission, by explicit user decision, rather than adding
# a new inventory.manage permission code (no new permission codes are being
# introduced in this stage). Revisit if a more precise code is ever approved.
_INVENTORY_WRITE_FALLBACK_PERMISSION = "inventory.adjust"


@router.get("", response_model=PaginatedResponse[InventoryRead])
def list_inventory(
    pagination: PaginationParams = Depends(get_pagination),
    product_id: Optional[uuid.UUID] = None,
    batch_id: Optional[uuid.UUID] = None,
    bin_id: Optional[uuid.UUID] = None,
    warehouse_id: Optional[uuid.UUID] = None,
    low_stock: Optional[bool] = None,
    current_user: User = Depends(require_permission("inventory.read")),
) -> PaginatedResponse[InventoryRead]:
    """Not yet backed by the database — returns an honestly empty result set."""
    return PaginatedResponse(items=[], total=0, limit=pagination.limit, offset=pagination.offset)


@router.post("", response_model=InventoryRead, status_code=201)
def create_inventory(
    payload: InventoryCreate,
    current_user: User = Depends(require_permission(_INVENTORY_WRITE_FALLBACK_PERMISSION)),
) -> InventoryRead:
    """
    Administrative/seeding use only. In normal operation, inventory rows
    should be created as a side effect of receiving/putaway via
    POST /stock-movements, not POSTed directly.

    Gated on inventory.adjust as a temporary fallback — see
    _INVENTORY_WRITE_FALLBACK_PERMISSION above; no exact-fit permission
    exists for direct creation.
    """
    not_implemented("Direct inventory creation is not implemented yet.")


@router.get("/{inventory_id}", response_model=InventoryRead)
def get_inventory(
    inventory_id: uuid.UUID,
    current_user: User = Depends(require_permission("inventory.read")),
) -> InventoryRead:
    not_implemented("Fetching an inventory record by id is not implemented yet.")


@router.patch("/{inventory_id}", response_model=InventoryRead)
def update_inventory(
    inventory_id: uuid.UUID,
    payload: InventoryUpdate,
    current_user: User = Depends(require_permission(_INVENTORY_WRITE_FALLBACK_PERMISSION)),
) -> InventoryRead:
    """
    Only bin_id/warehouse_id may ever be changed here — see
    InventoryUpdate, which deliberately excludes quantity and
    reserved_quantity. Those may only change via /adjust, /reserve,
    /release, or POST /stock-movements.

    Gated on inventory.adjust as a temporary fallback — see
    _INVENTORY_WRITE_FALLBACK_PERMISSION above; relocation is not itself a
    quantity correction, and no exact-fit permission exists.
    """
    not_implemented("Inventory update is not implemented yet.")


@router.delete("/{inventory_id}", status_code=204)
def delete_inventory(
    inventory_id: uuid.UUID,
    current_user: User = Depends(require_permission(_INVENTORY_WRITE_FALLBACK_PERMISSION)),
) -> None:
    """
    Must eventually be blocked unless quantity == 0 and reserved_quantity == 0.

    Gated on inventory.adjust as a temporary fallback — see
    _INVENTORY_WRITE_FALLBACK_PERMISSION above; no exact-fit permission
    exists for deletion.
    """
    not_implemented("Inventory deletion is not implemented yet.")


@router.post("/{inventory_id}/adjust", response_model=InventoryRead)
def adjust_inventory(
    inventory_id: uuid.UUID,
    payload: InventoryAdjustRequest,
    current_user: User = Depends(require_permission("inventory.adjust")),
) -> InventoryRead:
    """
    Dedicated business operation for cycle-count corrections. Must, once
    implemented, write a matching StockMovement (movement_type="Adjustment")
    and update Inventory.quantity in a single transaction with row-level
    locking — see the Stage 10 design report's concurrency notes.
    """
    not_implemented("Inventory adjustment is not implemented yet.")


@router.post("/{inventory_id}/reserve", response_model=InventoryRead)
def reserve_inventory(
    inventory_id: uuid.UUID,
    payload: InventoryReserveRequest,
    current_user: User = Depends(require_permission("inventory.reserve")),
) -> InventoryRead:
    """
    Must eventually use an atomic conditional UPDATE (or SELECT ... FOR
    UPDATE) — e.g. WHERE quantity - reserved_quantity >= :qty — to avoid the
    lost-update race described in the Stage 8 report.
    """
    not_implemented("Inventory reservation is not implemented yet.")


@router.post("/{inventory_id}/release", response_model=InventoryRead)
def release_inventory(
    inventory_id: uuid.UUID,
    payload: InventoryReleaseRequest,
    current_user: User = Depends(require_permission("inventory.reserve")),
) -> InventoryRead:
    """Gated on inventory.reserve — its seeded description explicitly
    covers "Reserve or release inventory for fulfillment"."""
    not_implemented("Inventory release is not implemented yet.")
