from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginationParams(BaseModel):
    """Resolved pagination query params — see app.dependencies.get_pagination."""

    limit: int = 20
    offset: int = 0


class PaginatedResponse(BaseModel, Generic[T]):
    """Shared envelope for every list endpoint's response."""

    items: List[T]
    total: int
    limit: int
    offset: int


class ErrorDetail(BaseModel):
    field: Optional[str] = None
    issue: str


class ErrorBody(BaseModel):
    code: str
    message: str
    details: Optional[List[ErrorDetail]] = None


class ErrorResponse(BaseModel):
    """Shared error envelope. Every error response app-wide should match this
    shape — see the exception handlers registered in app/main.py."""

    error: ErrorBody
