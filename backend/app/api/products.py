import uuid
from typing import Optional

from fastapi import APIRouter, Depends

from app.authorization import require_permission
from app.dependencies import get_pagination, not_implemented
from app.models.user import User
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=PaginatedResponse[ProductRead])
def list_products(
    pagination: PaginationParams = Depends(get_pagination),
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_permission("products.read")),
) -> PaginatedResponse[ProductRead]:
    """Not yet backed by the database — returns an honestly empty result set."""
    return PaginatedResponse(items=[], total=0, limit=pagination.limit, offset=pagination.offset)


@router.post("", response_model=ProductRead, status_code=201)
def create_product(
    payload: ProductCreate,
    current_user: User = Depends(require_permission("products.manage")),
) -> ProductRead:
    not_implemented("Product creation is not implemented yet.")


@router.get("/{product_id}", response_model=ProductRead)
def get_product(
    product_id: uuid.UUID,
    current_user: User = Depends(require_permission("products.read")),
) -> ProductRead:
    not_implemented("Fetching a product by id is not implemented yet.")


@router.patch("/{product_id}", response_model=ProductRead)
def update_product(
    product_id: uuid.UUID,
    payload: ProductUpdate,
    current_user: User = Depends(require_permission("products.manage")),
) -> ProductRead:
    not_implemented("Product update is not implemented yet.")


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: uuid.UUID,
    current_user: User = Depends(require_permission("products.manage")),
) -> None:
    """
    Must eventually be blocked (409) while any batches/inventory/movements/
    line-items reference this product.
    """
    not_implemented("Product deletion is not implemented yet.")
