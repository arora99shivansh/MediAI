from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AppointmentCreate(BaseModel):
    doctor_id: str
    date: str
    slot: str

class AppointmentResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    date: str
    slot: str
    status: str
    payment_status: Optional[str] = None
    payment_id: Optional[str] = None
    fee_amount: Optional[int] = None
    currency: Optional[str] = None
    meeting_link: Optional[str] = None
    created_at: datetime
    
    # Nested fields for UI display
    doctor_name: Optional[str] = None
    patient_name: Optional[str] = None

class AppointmentStatusUpdate(BaseModel):
    status: str # "confirmed", "rejected", "cancelled"


class VideoSessionResponse(BaseModel):
    provider: str
    room_name: str
    room_url: str
    token: str
    expires_at: datetime
