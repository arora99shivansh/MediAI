from datetime import datetime, UTC
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.utils.object_id import object_id
from app.schemas.message import MessageCreate

class MessageService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def send_message(self, sender_id: str, data: MessageCreate) -> dict:
        doc = {
            "sender_id": sender_id,
            "receiver_id": data.receiver_id,
            "content": data.content,
            "read_status": False,
            "timestamp": datetime.now(UTC)
        }
        result = await self.db.messages.insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        return doc

    async def get_conversation(self, user1_id: str, user2_id: str) -> list[dict]:
        query = {
            "$or": [
                {"sender_id": user1_id, "receiver_id": user2_id},
                {"sender_id": user2_id, "receiver_id": user1_id}
            ]
        }
        cursor = self.db.messages.find(query).sort("timestamp", 1)
        messages = await cursor.to_list(100)
        
        result = []
        for msg in messages:
            msg["id"] = str(msg.pop("_id"))
            result.append(msg)
            
        # Mark as read
        await self.db.messages.update_many(
            {"sender_id": user2_id, "receiver_id": user1_id, "read_status": False},
            {"$set": {"read_status": True}}
        )
            
        return result
