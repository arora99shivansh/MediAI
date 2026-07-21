from typing import Annotated

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.dependencies import require_roles
from app.database.mongo import get_db
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentStatusUpdate,
    VideoSessionResponse,
)
from app.services.appointment_service import AppointmentService
from app.services.video_service import VideoService

router = APIRouter(tags=["Appointments"])


@router.post("/book")
async def book_appointment(
    data: AppointmentCreate,
    user: Annotated[dict, Depends(require_roles("patient"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
) -> dict:
    """Book a new appointment."""
    patient_id = str(user["_id"])
    return await AppointmentService(db).book_appointment(patient_id, data)


@router.get("/patient", response_model=list[AppointmentResponse])
async def get_patient_appointments(
    user: Annotated[dict, Depends(require_roles("patient"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    """Get all appointments for the logged-in patient."""
    patient_id = str(user["_id"])
    return await AppointmentService(db).get_patient_appointments(patient_id)


@router.get("/doctor", response_model=list[AppointmentResponse])
async def get_doctor_appointments(
    user: Annotated[dict, Depends(require_roles("doctor"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    """Get all appointments for the logged-in doctor."""
    doctor_id = str(user["_id"])
    return await AppointmentService(db).get_doctor_appointments(doctor_id)


@router.put("/{appointment_id}/status")
async def update_appointment_status(
    appointment_id: str,
    data: AppointmentStatusUpdate,
    user: Annotated[dict, Depends(require_roles("doctor"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
) -> dict:
    """Update appointment status by doctor."""
    doctor_id = str(user["_id"])
    await AppointmentService(db).update_status(appointment_id, doctor_id, data.status)
    return {"status": "success"}


@router.get("/{appointment_id}/video-token", response_model=VideoSessionResponse)
async def get_video_token(
    appointment_id: str,
    user: Annotated[dict, Depends(require_roles("patient", "doctor"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    """Generate a secure Daily room token for a confirmed appointment."""
    return await VideoService(db).get_appointment_video_session(appointment_id, user)
