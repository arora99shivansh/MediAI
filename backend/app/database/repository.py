from typing import Any, Generic, TypeVar
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

T = TypeVar("T", bound=dict)

class BaseRepository(Generic[T]):
    collection_name: str

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db[self.collection_name]

    async def get_by_id(self, id: str | ObjectId) -> dict | None:
        return await self.collection.find_one({"_id": ObjectId(id) if isinstance(id, str) else id})

    async def get_one(self, query: dict) -> dict | None:
        return await self.collection.find_one(query)

    async def get_many(self, query: dict, limit: int = 100, skip: int = 0, sort: list | None = None) -> list[dict]:
        cursor = self.collection.find(query).skip(skip).limit(limit)
        if sort:
            cursor = cursor.sort(sort)
        return await cursor.to_list(length=limit)

    async def insert(self, data: dict) -> str:
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def update(self, id: str | ObjectId, data: dict) -> bool:
        result = await self.collection.update_one({"_id": ObjectId(id) if isinstance(id, str) else id}, {"$set": data})
        return result.modified_count > 0

    async def delete(self, id: str | ObjectId) -> bool:
        result = await self.collection.delete_one({"_id": ObjectId(id) if isinstance(id, str) else id})
        return result.deleted_count > 0

class UserRepository(BaseRepository):
    collection_name = "users"

class SessionRepository(BaseRepository):
    collection_name = "sessions"
