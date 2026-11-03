from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class CopilotQueryRequest(BaseModel):
    question: str = Field(min_length=1)

    model_config = ConfigDict(extra="forbid")


class CopilotQueryResponse(BaseModel):
    """
    Mirrors the frontend's existing CopilotQueryResult contract
    (src/services/warehouseCopilotService.ts) so the eventual backend
    implementation is a drop-in equivalent, not a redesign.
    """

    intent: str
    success: bool
    data: Optional[Any] = None
    message: str
