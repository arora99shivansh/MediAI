from typing import Annotated

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.dependencies import get_current_user, require_roles
from app.database.mongo import get_db
from app.schemas.doctor import PatientOverviewResponse, DoctorAIGenerateRequest, ClinicalNoteCreate, ClinicalNoteResponse
from app.services.doctor_service import DoctorService

router = APIRouter(tags=["Doctor Portal"])


@router.get("/patients/all")
async def get_all_patients(
    user: Annotated[dict, Depends(require_roles("doctor", "admin"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
) -> list[dict]:
    """Get ALL patients across the system (for directory search)."""
    return await DoctorService(db).search_all_patients()


@router.post("/patients/{patient_id}/assign")
async def assign_patient(
    patient_id: str,
    user: Annotated[dict, Depends(require_roles("doctor", "admin"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
) -> dict:
    """Assign a patient to the current doctor."""
    doctor_id = str(user["_id"])
    return await DoctorService(db).assign_patient(doctor_id, patient_id)


@router.get("/patients")
async def get_patients(
    user: Annotated[dict, Depends(require_roles("doctor", "admin"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
) -> list[dict]:
    """Get assigned patients for the doctor dashboard."""
    doctor_id = str(user["_id"]) if user.get("role") == "doctor" else None
    return await DoctorService(db).get_patient_list(doctor_id)


@router.get("/patients/{patient_id}/overview", response_model=PatientOverviewResponse)
async def get_patient_overview(
    patient_id: str,
    user: Annotated[dict, Depends(require_roles("doctor", "admin"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    """Get a comprehensive 360 overview of a specific patient."""
    doctor_id = str(user["_id"]) if user.get("role") == "doctor" else None
    return await DoctorService(db).get_patient_overview(patient_id, doctor_id)


@router.post("/ai/generate")
async def generate_doctor_ai(
    payload: DoctorAIGenerateRequest,
    user: Annotated[dict, Depends(require_roles("doctor", "admin"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
) -> dict:
    """Use Doctor AI to generate clinical content."""
    doctor_id = str(user["_id"]) if user.get("role") == "doctor" else None
    content = await DoctorService(db).generate_doctor_ai_content(
        payload.patient_id, payload.task_type, payload.additional_context, doctor_id
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
    doctor_id = str(user["_id"]) if user.get("role") == "doctor" else None
    # Add check in service to ensure doctor_id owns the patient
    return await DoctorService(db).save_clinical_note(note, str(user["_id"]), doctor_id)


@router.get("/patients/{patient_id}/notes")
async def get_clinical_notes(
    patient_id: str,
    user: Annotated[dict, Depends(require_roles("doctor", "admin"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
) -> list[dict]:
    """Get all clinical notes for a patient."""
    doctor_id = str(user["_id"]) if user.get("role") == "doctor" else None
    return await DoctorService(db).get_clinical_notes(patient_id, doctor_id)
