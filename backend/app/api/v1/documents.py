from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, File, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.dependencies import get_current_user
from app.database.mongo import get_db
from app.rag.rag_service import RAGService
from app.schemas.documents import SearchRequest

router = APIRouter(tags=["Documents"])

@router.post("/upload", status_code=201)
async def upload_documents(
    user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    files: Annotated[list[UploadFile], File(description="PDF, DOCX, or TXT files")],
    background_tasks: BackgroundTasks,
) -> list[dict]:
    return await RAGService(db).save_uploads(files, user["_id"], background_tasks)


@router.get("/documents")
async def documents(user: Annotated[dict, Depends(get_current_user)], db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]) -> list[dict]:
    return await RAGService(db).list_documents(user["_id"])


@router.delete("/documents/{document_id}")
async def delete_document(document_id: str, user: Annotated[dict, Depends(get_current_user)], db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]) -> dict:
    await RAGService(db).delete_document(document_id, user["_id"])
    return {"status": "deleted"}


@router.post("/search")
async def search_documents(
    payload: SearchRequest,
    user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
) -> list[dict]:
    return await RAGService(db).search(payload.query, user["_id"], payload.top_k)
