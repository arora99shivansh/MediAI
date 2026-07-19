from typing import Annotated

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config.settings import get_settings
from app.database.mongo import get_db

router = APIRouter(tags=["Health"])

_APP_VERSION = "1.0.0"


@router.get(
    "/health",
    summary="Liveness and readiness check",
    description="Returns application version, environment, and database connectivity status. Suitable for load-balancer health probes.",
)
async def health(db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]) -> dict:
    await db.command("ping")
    settings = get_settings()
    return {
        "status": "ok",
        "version": _APP_VERSION,
        "app": settings.app_name,
        "environment": settings.environment,
        "database": "ok",
    }
