from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.dependencies import require_roles
from app.config.settings import get_settings
from app.database.mongo import get_db

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard")
async def dashboard(
    _: Annotated[dict, Depends(require_roles("admin"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
) -> dict:
    since = datetime.now(UTC) - timedelta(days=14)
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"last_login_at": {"$gte": since}})
    uploaded_files = await db.documents.count_documents({})
    storage = await db.documents.aggregate([{"$group": {"_id": None, "bytes": {"$sum": "$size_bytes"}}}]).to_list(1)
    query_pipeline = [
        {"$match": {"event": "chat_completion", "created_at": {"$gte": since}}},
        {"$group": {"_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    questions_pipeline = [
        {"$match": {"event": "chat_completion"}},
        {"$group": {"_id": "$metadata.question", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]
    usage_pipeline = [
        {"$match": {"event": "chat_completion"}},
        {
            "$group": {
                "_id": None,
                "prompt_tokens": {"$sum": "$metadata.usage.prompt_tokens"},
                "completion_tokens": {"$sum": "$metadata.usage.completion_tokens"},
                "total_tokens": {"$sum": "$metadata.usage.total_tokens"},
                "avg_latency_ms": {"$avg": "$metadata.usage.latency_ms"},
            }
        },
    ]
    disease_pipeline = [
        {"$unwind": "$metadata.entities.diseases"},
        {"$group": {"_id": "$metadata.entities.diseases", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]
    medicine_pipeline = [
        {"$unwind": "$metadata.entities.medicines"},
        {"$group": {"_id": "$metadata.entities.medicines", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]
    queries_per_day = await db.analytics.aggregate(query_pipeline).to_list(30)
    most_asked = await db.analytics.aggregate(questions_pipeline).to_list(10)
    usage = (await db.analytics.aggregate(usage_pipeline).to_list(1)) or [{}]
    diseases = await db.analytics.aggregate(disease_pipeline).to_list(10)
    medicines = await db.analytics.aggregate(medicine_pipeline).to_list(10)
    token_usage = usage[0]
    latency = token_usage.get("avg_latency_ms") or 0
    return {
        "total_users": total_users,
        "active_users": active_users,
        "uploaded_files": uploaded_files,
        "queries_per_day": [{"date": item["_id"], "count": item["count"]} for item in queries_per_day],
        "llm_usage": {"provider": "Groq", "model": get_settings().groq_model},
        "token_usage": {key: token_usage.get(key, 0) for key in ["prompt_tokens", "completion_tokens", "total_tokens"]},
        "storage_usage": {"bytes": storage[0]["bytes"] if storage else 0},
        "most_asked_questions": [{"question": item["_id"], "count": item["count"]} for item in most_asked if item["_id"]],
        "top_diseases": [{"name": item["_id"], "count": item["count"]} for item in diseases],
        "top_medicines": [{"name": item["_id"], "count": item["count"]} for item in medicines],
        "response_time_ms": [{"metric": "llm_average", "value": round(latency, 2)}],
        "api_latency_ms": [{"metric": "available_at", "value": "/metrics"}],
    }

from pydantic import BaseModel
from app.utils.object_id import object_id

class DoctorStatusUpdate(BaseModel):
    status: str # "approved", "rejected"

@router.get("/doctors")
async def get_all_doctors(
    _: Annotated[dict, Depends(require_roles("admin"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    """Get all doctors for admin review."""
    cursor = db.users.find({"role": "doctor"}, {"password_hash": 0}).sort("created_at", -1)
    doctors = await cursor.to_list(100)
    for doc in doctors:
        doc["_id"] = str(doc["_id"])
    return doctors

@router.put("/doctors/{doctor_id}/status")
async def update_doctor_status(
    doctor_id: str,
    payload: DoctorStatusUpdate,
    _: Annotated[dict, Depends(require_roles("admin"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    """Approve or reject a doctor."""
    await db.users.update_one(
        {"_id": object_id(doctor_id), "role": "doctor"},
        {"$set": {"status": payload.status}}
    )
    return {"status": "success"}
