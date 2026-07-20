from typing import Annotated
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database.mongo import get_db
from app.auth.dependencies import get_current_user, require_roles
from app.schemas.appointment import AppointmentCreate, AppointmentResponse, AppointmentStatusUpdate
from app.services.appointment_service import AppointmentService

router = APIRouter(tags=["Appointments"])

@router.post("/book")
async def book_appointment(
    data: AppointmentCreate,
    user: Annotated[dict, Depends(require_roles("patient"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
) -> dict:
    """Book a new appointment."""
    patient_id = str(user["_id"])
    return await AppointmentService(db).book_appointment(patient_id, data)


@router.get("/patient", response_model=list[AppointmentResponse])
async def get_patient_appointments(
    user: Annotated[dict, Depends(require_roles("patient"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    """Get all appointments for the logged-in patient."""
    patient_id = str(user["_id"])
    return await AppointmentService(db).get_patient_appointments(patient_id)


@router.get("/doctor", response_model=list[AppointmentResponse])
async def get_doctor_appointments(
    user: Annotated[dict, Depends(require_roles("doctor"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    """Get all appointments for the logged-in doctor."""
    doctor_id = str(user["_id"])
    return await AppointmentService(db).get_doctor_appointments(doctor_id)


@router.put("/{appointment_id}/status")
async def update_appointment_status(
    appointment_id: str,
    data: AppointmentStatusUpdate,
    user: Annotated[dict, Depends(require_roles("doctor"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
) -> dict:
    """Update appointment status (accept/reject) by doctor."""
    doctor_id = str(user["_id"])
    await AppointmentService(db).update_status(appointment_id, doctor_id, data.status)
    return {"status": "success"}
