import uuid
from typing import Optional

from fastapi import APIRouter, Depends

from app.authorization import require_permission
from app.dependencies import get_pagination, not_implemented
from app.models.user import User
from app.schemas.batch import BatchCreate, BatchInspectionUpdate, BatchRead, BatchUpdate
from app.schemas.common import PaginatedResponse, PaginationParams

router = APIRouter(prefix="/batches", tags=["batches"])


@router.get("", response_model=PaginatedResponse[BatchRead])
def list_batches(
    pagination: PaginationParams = Depends(get_pagination),
    product_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    expiring_within_days: Optional[int] = None,
    expired: Optional[bool] = None,
    current_user: User = Depends(require_permission("batches.read")),
) -> PaginatedResponse[BatchRead]:
    """Not yet backed by the database — returns an honestly empty result set."""
    return PaginatedResponse(items=[], total=0, limit=pagination.limit, offset=pagination.offset)


@router.post("", response_model=BatchRead, status_code=201)
def create_batch(
    payload: BatchCreate,
    current_user: User = Depends(require_permission("batches.create")),
) -> BatchRead:
    not_implemented("Batch creation is not implemented yet.")


@router.get("/{batch_id}", response_model=BatchRead)
def get_batch(
    batch_id: uuid.UUID,
    current_user: User = Depends(require_permission("batches.read")),
) -> BatchRead:
    not_implemented("Fetching a batch by id is not implemented yet.")


@router.patch("/{batch_id}", response_model=BatchRead)
def update_batch(
    batch_id: uuid.UUID,
    payload: BatchUpdate,
    current_user: User = Depends(require_permission("batches.manage")),
) -> BatchRead:
    not_implemented("Batch update is not implemented yet.")


@router.delete("/{batch_id}", status_code=204)
def delete_batch(
    batch_id: uuid.UUID,
    current_user: User = Depends(require_permission("batches.manage")),
) -> None:
    """
    Must eventually be blocked (409) while any inventory row references this
    batch — inventory.batch_id is NOT NULL as of Stage 9, so a batch can
    never be safely deleted while inventory still points to it.
    """
    not_implemented("Batch deletion is not implemented yet.")


@router.post("/{batch_id}/inspect", response_model=BatchRead)
def inspect_batch(
    batch_id: uuid.UUID,
    payload: BatchInspectionUpdate,
    current_user: User = Depends(require_permission("quality.inspect")),
) -> BatchRead:
    """
    Dedicated quality-inspection action, separate from the general
    PATCH /batches/{id} (batches.manage) — deliberately narrow, matching
    quality_inspector's documented scope (status transitions only).
    """
    not_implemented("Batch inspection is not implemented yet.")
