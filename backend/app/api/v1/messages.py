from typing import Annotated
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database.mongo import get_db
from app.auth.dependencies import get_current_user
from app.schemas.message import MessageCreate, MessageResponse
from app.services.message_service import MessageService

router = APIRouter(tags=["Messages"])

@router.post("/", response_model=MessageResponse)
async def send_message(
    data: MessageCreate,
    user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    """Send a secure message."""
    sender_id = str(user["_id"])
    return await MessageService(db).send_message(sender_id, data)

@router.get("/{other_user_id}", response_model=list[MessageResponse])
async def get_messages(
    other_user_id: str,
    user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    """Get conversation history."""
    current_user_id = str(user["_id"])
    return await MessageService(db).get_conversation(current_user_id, other_user_id)
