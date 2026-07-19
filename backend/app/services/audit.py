from datetime import UTC, datetime

from motor.motor_asyncio import AsyncIOMotorDatabase


async def log_event(db: AsyncIOMotorDatabase, event: str, user_id: str | None, metadata: dict | None = None) -> None:
    await db.analytics.insert_one(
        {
            "event": event,
            "user_id": user_id,
            "metadata": metadata or {},
            "created_at": datetime.now(UTC),
        }
    )
