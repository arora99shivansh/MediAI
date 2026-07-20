from collections.abc import AsyncIterator

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config.settings import get_settings

_client: AsyncIOMotorClient | None = None


async def connect_to_mongo() -> None:
    global _client
    settings = get_settings()
    _client = AsyncIOMotorClient(
        settings.mongodb_uri,
        uuidRepresentation="standard",
        serverSelectionTimeoutMS=5000,
    )
    try:
        await _client.admin.command("ping")
        db = get_database()
        await db.users.create_index("email", unique=True)
        await db.users.create_index("role")
        await db.documents.create_index([("user_id", 1), ("created_at", -1)])
        await db.embeddings.create_index([("user_id", 1), ("document_id", 1)])
        await db.chat_history.create_index([("user_id", 1), ("updated_at", -1)])
        await db.chat_history.create_index([("title", "text"), ("messages.content", "text")])
        await db.sessions.create_index("refresh_token_hash", unique=True)
        await db.sessions.create_index("expires_at", expireAfterSeconds=0)
        await db.analytics.create_index([("event", 1), ("created_at", -1)])
        await db.logs.create_index("created_at")

        # New Health OS Collections
        await db.health_memory.create_index([("user_id", 1), ("created_at", -1)])
        await db.health_timeline.create_index([("user_id", 1), ("date", -1)])
        await db.risk_profiles.create_index([("user_id", 1), ("updated_at", -1)])
        await db.medications.create_index([("user_id", 1), ("status", 1)])
        await db.symptom_logs.create_index([("user_id", 1), ("date", -1)])
        await db.health_scores.create_index([("user_id", 1), ("date", -1)])
        await db.clinical_notes.create_index([("patient_id", 1), ("created_at", -1)])
    except Exception as exc:
        import logging
        logging.getLogger("mediai").warning(
            "MongoDB not reachable at startup — server will start but DB calls will fail: %s", exc
        )


async def close_mongo_connection() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


def get_database() -> AsyncIOMotorDatabase:
    if _client is None:
        raise RuntimeError("MongoDB is not connected")
    settings = get_settings()
    return _client[settings.mongodb_database]


async def get_db() -> AsyncIterator[AsyncIOMotorDatabase]:
    yield get_database()
