import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class InventoryBase(BaseModel):
    product_id: uuid.UUID
    batch_id: uuid.UUID  # NOT NULL as of Stage 9 — every inventory record must belong to a batch.
    bin_id: Optional[uuid.UUID] = None
    warehouse_id: Optional[uuid.UUID] = None


class InventoryCreate(InventoryBase):
    quantity: int = Field(ge=0)
    reserved_quantity: int = Field(default=0, ge=0)

    model_config = ConfigDict(extra="forbid")


class InventoryUpdate(BaseModel):
    """
    Deliberately excludes quantity/reserved_quantity. Those may only change
    via POST /inventory/{id}/adjust|reserve|release or POST /stock-movements
    — never a direct PATCH — so every quantity change has a corresponding
    stock_movements audit row. See the Stage 10 design report.
    """

    bin_id: Optional[uuid.UUID] = None
    warehouse_id: Optional[uuid.UUID] = None

    model_config = ConfigDict(extra="forbid")


class InventoryRead(InventoryBase):
    id: uuid.UUID
    quantity: int
    reserved_quantity: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InventoryAdjustRequest(BaseModel):
    """Cycle-count correction: caller states the true counted quantity."""

    new_quantity: int = Field(ge=0)
    reason: str

    model_config = ConfigDict(extra="forbid")


class InventoryReserveRequest(BaseModel):
    quantity: int = Field(gt=0)

    model_config = ConfigDict(extra="forbid")


class InventoryReleaseRequest(BaseModel):
    quantity: int = Field(gt=0)

    model_config = ConfigDict(extra="forbid")
