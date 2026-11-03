import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class WarehouseBase(BaseModel):
    name: str
    code: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    status: str = "active"


class WarehouseCreate(WarehouseBase):
    model_config = ConfigDict(extra="forbid")


class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    status: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class WarehouseRead(WarehouseBase):
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
