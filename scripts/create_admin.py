import asyncio
import os
from datetime import UTC, datetime

from motor.motor_asyncio import AsyncIOMotorClient

from app.utils.password import hash_password


async def main() -> None:
    uri = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
    database = os.environ.get("MONGODB_DATABASE", "mediai")
    email = os.environ["ADMIN_EMAIL"].lower()
    password = os.environ["ADMIN_PASSWORD"]
    client = AsyncIOMotorClient(uri)
    now = datetime.now(UTC)
    await client[database].users.update_one(
        {"email": email},
        {
            "$set": {
                "email": email,
                "full_name": os.environ.get("ADMIN_NAME", "MediAI Admin"),
                "role": "admin",
                "password_hash": hash_password(password),
                "is_verified": True,
                "disabled": False,
                "updated_at": now,
            },
            "$setOnInsert": {"created_at": now, "last_login_at": None},
        },
        upsert=True,
    )
    client.close()
    print(f"Admin ready: {email}")


if __name__ == "__main__":
    asyncio.run(main())
