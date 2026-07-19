from datetime import datetime, UTC
from typing import Annotated
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.dependencies import get_current_user
from app.database.mongo import get_db
from app.utils.object_id import serialize_document

router = APIRouter(tags=["Patient"])

class SymptomLog(BaseModel):
    symptom: str
    severity: int
    notes: str = ""

@router.get("/patient/profile")
async def get_profile(user: Annotated[dict, Depends(get_current_user)], db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]) -> dict:
    profile = await db.risk_profiles.find_one({"user_id": user["_id"]})
    if not profile:
        return {}
    return serialize_document(profile)

@router.get("/patient/timeline")
async def get_timeline(user: Annotated[dict, Depends(get_current_user)], db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]) -> list[dict]:
    timeline = await db.health_timeline.find({"user_id": user["_id"]}).sort("date", -1).to_list(100)
    return [serialize_document(t) for t in timeline]

@router.get("/patient/medications")
async def get_medications(user: Annotated[dict, Depends(get_current_user)], db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]) -> list[dict]:
    meds = await db.medications.find({"user_id": user["_id"]}).to_list(100)
    return [serialize_document(m) for m in meds]

@router.get("/patient/memory")
async def get_memory(user: Annotated[dict, Depends(get_current_user)], db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]) -> list[dict]:
    memory = await db.health_memory.find({"user_id": user["_id"]}).sort("created_at", -1).to_list(50)
    return [serialize_document(m) for m in memory]

@router.post("/patient/symptoms")
async def log_symptom(
    payload: SymptomLog,
    user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
) -> dict:
    now = datetime.now(UTC)
    doc = {
        "user_id": user["_id"],
        "symptom": payload.symptom,
        "severity": payload.severity,
        "notes": payload.notes,
        "date": now.strftime("%Y-%m-%d"),
        "created_at": now
    }
    await db.symptom_logs.insert_one(doc)
    return {"status": "logged"}

@router.get("/patient/symptoms")
async def get_symptoms(user: Annotated[dict, Depends(get_current_user)], db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]) -> list[dict]:
    logs = await db.symptom_logs.find({"user_id": user["_id"]}).sort("created_at", -1).to_list(100)
    return [serialize_document(l) for l in logs]
