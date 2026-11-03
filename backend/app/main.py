from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app import models  # noqa: F401  (registers all models on Base.metadata)
from app.api.router import api_router
from app.config import settings
from app.database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Foundation-stage schema bootstrap. This will be replaced by Alembic
    # migrations once the schema needs versioned, incremental changes.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.include_router(api_router)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Normalizes every HTTPException onto the shared {"error": {...}} envelope
    (see app.schemas.common.ErrorResponse), instead of Starlette's default
    {"detail": ...} wrapping."""
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        content = exc.detail
    else:
        content = {"error": {"code": "HTTP_ERROR", "message": str(exc.detail)}}
    return JSONResponse(status_code=exc.status_code, content=content)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Normalizes Pydantic/body validation failures onto the shared error envelope."""
    details = [
        {"field": ".".join(str(part) for part in error["loc"][1:]), "issue": error["msg"]}
        for error in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "One or more fields are invalid.",
                "details": details,
            }
        },
    )


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "app": settings.app_name, "env": settings.app_env}
