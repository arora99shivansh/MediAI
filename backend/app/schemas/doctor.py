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
