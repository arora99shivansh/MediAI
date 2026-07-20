from typing import Annotated

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.dependencies import get_current_user, require_roles
from app.database.mongo import get_db
from app.schemas.doctor import PatientOverviewResponse, DoctorAIGenerateRequest, ClinicalNoteCreate, ClinicalNoteResponse
from app.services.doctor_service import DoctorService

router = APIRouter(tags=["Doctor Portal"])


@router.get("/patients")
async def get_patients(
    _: Annotated[dict, Depends(require_roles("doctor", "admin"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
) -> list[dict]:
    """Get all patients for the doctor dashboard."""
    return await DoctorService(db).get_patient_list()


@router.get("/patients/{patient_id}/overview", response_model=PatientOverviewResponse)
async def get_patient_overview(
    patient_id: str,
    _: Annotated[dict, Depends(require_roles("doctor", "admin"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    """Get a comprehensive 360 overview of a specific patient."""
    return await DoctorService(db).get_patient_overview(patient_id)


@router.post("/ai/generate")
async def generate_doctor_ai(
    payload: DoctorAIGenerateRequest,
    _: Annotated[dict, Depends(require_roles("doctor", "admin"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
) -> dict:
    """Use Doctor AI to generate clinical content."""
    content = await DoctorService(db).generate_doctor_ai_content(
        payload.patient_id, payload.task_type, payload.additional_context
    )
    return {"content": content}


@router.post("/notes", response_model=ClinicalNoteResponse)
async def save_clinical_note(
    note: ClinicalNoteCreate,
    user: Annotated[dict, Depends(get_current_user)],
    _: Annotated[dict, Depends(require_roles("doctor", "admin"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    """Save a clinical note for a patient."""
    return await DoctorService(db).save_clinical_note(note, str(user["_id"]))


@router.get("/patients/{patient_id}/notes")
async def get_clinical_notes(
    patient_id: str,
    _: Annotated[dict, Depends(require_roles("doctor", "admin"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
) -> list[dict]:
    """Get all clinical notes for a patient."""
    return await DoctorService(db).get_clinical_notes(patient_id)
