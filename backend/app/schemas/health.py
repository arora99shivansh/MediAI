from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class MedicationExtract(BaseModel):
    name: str = Field(description="Name of the medication")
    dosage: str = Field(description="Dosage of the medication (e.g., '500mg')")
    frequency: str = Field(description="How often to take it (e.g., 'twice a day')")
    duration: Optional[str] = Field(None, description="How long to take it for")
    reason: Optional[str] = Field(None, description="Reason for taking the medication if mentioned")

class VitalExtract(BaseModel):
    name: str = Field(description="Name of the vital or lab test (e.g., 'Blood Sugar', 'Blood Pressure', 'Hemoglobin', 'Cholesterol')")
    value: str = Field(description="The measured value (e.g., '120/80', '95', '5.2')")
    unit: Optional[str] = Field(None, description="Unit of measurement (e.g., 'mg/dL', 'mmHg')")
    status: Optional[str] = Field(None, description="Status if explicitly stated (e.g., 'High', 'Low', 'Normal')")

class ConditionExtract(BaseModel):
    name: str = Field(description="Name of the condition or diagnosis")
    status: Optional[str] = Field(None, description="Status (e.g., 'Chronic', 'Acute', 'Resolved')")

class HealthDocumentExtraction(BaseModel):
    date_of_report: Optional[str] = Field(None, description="Date the report or document was created (YYYY-MM-DD) if available")
    medications: list[MedicationExtract] = Field(default_factory=list, description="List of medications found in the text")
    vitals: list[VitalExtract] = Field(default_factory=list, description="List of vitals, lab results, or measurements found in the text")
    conditions: list[ConditionExtract] = Field(default_factory=list, description="List of diagnoses, diseases, or conditions mentioned")
    red_flags: list[str] = Field(default_factory=list, description="List of critical life-threatening warnings or severe abnormal values requiring immediate medical attention")
    summary: str = Field(description="A brief 1-2 sentence medical summary of the document")

class RiskPrediction(BaseModel):
    condition: str = Field(description="Name of the condition at risk (e.g., 'Diabetes', 'Hypertension')")
    risk_level: str = Field(description="Must be exactly 'Low', 'Medium', or 'High'")
    reasoning: str = Field(description="Short medical reasoning for this risk level based on the patient's data")

class FollowUpAction(BaseModel):
    type: str = Field(description="Category (e.g., 'Test', 'Lifestyle', 'Doctor Question', 'Monitor')")
    description: str = Field(description="Specific actionable step (e.g., 'Test HbA1c in 3 months', 'Drink 2L water daily')")

class DigitalTwinUpdate(BaseModel):
    age: Optional[int] = Field(None)
    gender: Optional[str] = Field(None)
    chronic_conditions: list[str] = Field(default_factory=list)
    allergies: list[str] = Field(default_factory=list)
    lifestyle_factors: list[str] = Field(default_factory=list)
    family_history: list[str] = Field(default_factory=list)
    risk_predictions: list[RiskPrediction] = Field(default_factory=list)
    follow_up_actions: list[FollowUpAction] = Field(default_factory=list)
