import json
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.dependencies import get_current_user
from app.chat.chat_service import ChatService
from app.database.mongo import get_db
from app.schemas.chat import ChatRequest, RenameChatRequest

router = APIRouter(tags=["Chat"])


@router.post("/chat")
async def chat(payload: ChatRequest, user: Annotated[dict, Depends(get_current_user)], db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]) -> dict:
    return await ChatService(db).answer(user["_id"], payload.message, payload.chat_id, payload.language, payload.top_k)


@router.post("/chat/stream")
async def stream_chat(payload: ChatRequest, user: Annotated[dict, Depends(get_current_user)], db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]):
    service = ChatService(db)
    chat_doc, matches, prompt, agent_name = await service.prepare_stream(user["_id"], payload.message, payload.chat_id, payload.language, payload.top_k)
    history = chat_doc.get("messages", [])

    async def events():
        answer_parts: list[str] = []
        async for token in service.llm.stream(prompt, history):
            answer_parts.append(token)
            yield f"data: {json.dumps({'token': token})}\n\n"
        await service.save_streamed_response(chat_doc, payload.message, "".join(answer_parts), matches)
        yield f"data: {json.dumps({'done': True, 'chat_id': str(chat_doc['_id']), 'citations': matches, 'agent': agent_name})}\n\n"

    return StreamingResponse(events(), media_type="text/event-stream")


@router.get("/chat/history")
async def chat_history(user: Annotated[dict, Depends(get_current_user)], db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]) -> list[dict]:
    return await ChatService(db).history(user["_id"])


@router.get("/chat/search")
async def search_chats(
    q: Annotated[str, Query(min_length=1)],
    user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
) -> list[dict]:
    return await ChatService(db).search_chats(q, user["_id"])


@router.get("/chat/{chat_id}")
async def get_chat(chat_id: str, user: Annotated[dict, Depends(get_current_user)], db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]) -> dict:
    return await ChatService(db).get_chat(chat_id, user["_id"])


@router.delete("/chat/delete/{chat_id}")
async def delete_chat(chat_id: str, user: Annotated[dict, Depends(get_current_user)], db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]) -> dict:
    await ChatService(db).delete(chat_id, user["_id"])
    return {"status": "deleted"}


@router.patch("/chat/rename/{chat_id}")
async def rename_chat(
    chat_id: str,
    payload: RenameChatRequest,
    user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
) -> dict:
    await ChatService(db).rename(chat_id, user["_id"], payload.title)
    return {"status": "renamed"}


@router.patch("/chat/pin/{chat_id}")
async def pin_chat(
    chat_id: str,
    pinned: bool,
    user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
) -> dict:
    await ChatService(db).pin(chat_id, user["_id"], pinned)
    return {"status": "updated", "pinned": pinned}


@router.get("/chat/export/{chat_id}")
async def export_chat(chat_id: str, user: Annotated[dict, Depends(get_current_user)], db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]) -> dict:
    return await ChatService(db).get_chat(chat_id, user["_id"])
