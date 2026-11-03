from fastapi import APIRouter, Depends

from app.dependencies import get_current_user, not_implemented
from app.models.user import User
from app.schemas.copilot import CopilotQueryRequest, CopilotQueryResponse

router = APIRouter(prefix="/copilot", tags=["copilot"])


@router.post("/query", response_model=CopilotQueryResponse)
def copilot_query(
    payload: CopilotQueryRequest,
    current_user: User = Depends(get_current_user),
) -> CopilotQueryResponse:
    """
    Not implemented yet. Once built, this must be a Python port of the same
    deterministic keyword-routing design already proven in the frontend's
    warehouseCopilotService.ts (see the Stage 10 design report) — querying
    real Postgres tables, never an LLM, never a fabricated confidence score
    or narrative not derived from actual returned data.
    """
    not_implemented("The Copilot query endpoint is not implemented yet.")
