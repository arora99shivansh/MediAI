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

@router.get("/{appointment_id}/video-token")
async def get_video_token(
    appointment_id: str,
    user: Annotated[dict, Depends(require_roles("patient", "doctor"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
) -> dict:
    """Generate a secure video room URL/token for an appointment."""
    from fastapi import HTTPException
    from app.utils.object_id import object_id
    
    appointment = await db.appointments.find_one({"_id": object_id(appointment_id)})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    user_id = str(user["_id"])
    if user_id not in [appointment.get("patient_id"), appointment.get("doctor_id")]:
        raise HTTPException(status_code=403, detail="Not authorized to join this consultation")
        
    if appointment.get("status") != "confirmed":
        raise HTTPException(status_code=400, detail="Appointment is not confirmed")
        
    # Generate a unique deterministic room name based on appointment ID
    # In a real production app, we would use Twilio Video SDK or Jitsi JWT tokens here.
    # We return a secure room name to be used with the Jitsi iFrame API on the frontend.
    room_name = f"doordoctor-consult-{appointment_id}-{appointment.get('date').replace('-', '')}"
    
    return {
        "room_name": room_name,
        "token": "mock-jwt-token-if-needed"
    }
