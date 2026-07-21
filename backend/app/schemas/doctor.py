from datetime import datetime
from pydantic import BaseModel, Field


class ClinicalNoteCreate(BaseModel):
    patient_id: str
    title: str
    content: str
    note_type: str = Field(default="general", description="e.g., soap_note, summary, general")


class ClinicalNoteResponse(ClinicalNoteCreate):
    id: str
    doctor_id: str
    created_at: datetime


class DoctorAIGenerateRequest(BaseModel):
    patient_id: str
    task_type: str = Field(..., description="e.g., soap_note, clinical_summary, differential_diagnosis")
    additional_context: str | None = Field(default=None, description="Any specific doctor instructions or queries")


class PatientOverviewResponse(BaseModel):
    user_id: str
    full_name: str
    email: str
    age: int | None = None
    gender: str | None = None
    risk_level: str = "Low"
    chronic_conditions: list[str] = []
    allergies: list[str] = []
    recent_vitals: list[dict] = []
    active_medications: list[dict] = []
    last_visit: datetime | None = None

class DoctorProfileUpdate(BaseModel):
    specialization: str | None = None
    experience_years: int | None = None
    consultation_fee: float | None = None
    hospital: str | None = None
    city: str | None = None
    about: str | None = None
    # e.g., {"Monday": ["09:00 AM", "09:30 AM"], "Tuesday": []}
    availability: dict[str, list[str]] | None = None

class DoctorProfileResponse(BaseModel):
    id: str = Field(alias="_id")
    full_name: str
    specialization: str | None = None
    experience_years: int | None = None
    consultation_fee: float | None = None
    hospital: str | None = None
    city: str | None = None
    about: str | None = None
    
    # Dynamic fields calculated on the fly
    available_dates: list[str] = []
    time_slots_by_date: dict[str, list[str]] = {}
