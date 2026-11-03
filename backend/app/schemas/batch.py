import uuid
from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict, model_validator


class BatchBase(BaseModel):
    product_id: uuid.UUID
    batch_number: str
    manufacturing_date: Optional[date] = None
    expiry_date: Optional[date] = None
    status: str = "accepted"

    @model_validator(mode="after")
    def check_date_order(self) -> "BatchBase":
        if self.manufacturing_date and self.expiry_date and self.expiry_date < self.manufacturing_date:
            raise ValueError("expiry_date must be on or after manufacturing_date")
        return self


class BatchCreate(BatchBase):
    model_config = ConfigDict(extra="forbid")


class BatchUpdate(BaseModel):
    manufacturing_date: Optional[date] = None
    expiry_date: Optional[date] = None
    status: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class BatchInspectionUpdate(BaseModel):
    """
    Request body for the dedicated POST /batches/{id}/inspect action
    (quality.inspect permission) — deliberately narrower than BatchUpdate
    (batches.manage): only the status transition a quality inspection
    performs, not manufacturing_date/expiry_date editing.
    """

    status: str

    model_config = ConfigDict(extra="forbid")


class BatchRead(BatchBase):
    id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)
