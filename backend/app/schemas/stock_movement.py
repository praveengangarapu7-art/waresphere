import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.stock_movement import MOVEMENT_TYPES


class StockMovementBase(BaseModel):
    product_id: uuid.UUID
    batch_id: Optional[uuid.UUID] = None
    source_bin_id: Optional[uuid.UUID] = None
    destination_bin_id: Optional[uuid.UUID] = None
    warehouse_id: Optional[uuid.UUID] = None
    movement_type: str
    quantity: int = Field(gt=0)
    reference_number: Optional[str] = None
    reason: Optional[str] = None

    @field_validator("movement_type")
    @classmethod
    def validate_movement_type(cls, value: str) -> str:
        if value not in MOVEMENT_TYPES:
            raise ValueError(f"movement_type must be one of {MOVEMENT_TYPES}")
        return value


class StockMovementCreate(StockMovementBase):
    """
    Client-submitted fields only. There is deliberately no actor_id field
    here: actor_id must be derived server-side from the authenticated user
    (see app.dependencies.get_current_user_id) and is never trusted from the
    request body. extra="forbid" also rejects a client attempting to smuggle
    one in anyway.
    """

    model_config = ConfigDict(extra="forbid")


class StockMovementRead(StockMovementBase):
    id: uuid.UUID
    actor_id: Optional[uuid.UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
