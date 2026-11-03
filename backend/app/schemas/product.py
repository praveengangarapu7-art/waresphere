import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    sku_code: str
    name: str
    category: Optional[str] = None
    unit: str = "units"
    reorder_point: int = Field(default=0, ge=0)
    safety_stock: int = Field(default=0, ge=0)
    unit_cost: float = Field(ge=0)


class ProductCreate(ProductBase):
    model_config = ConfigDict(extra="forbid")


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    reorder_point: Optional[int] = Field(default=None, ge=0)
    safety_stock: Optional[int] = Field(default=None, ge=0)
    unit_cost: Optional[float] = Field(default=None, ge=0)

    model_config = ConfigDict(extra="forbid")


class ProductRead(ProductBase):
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
