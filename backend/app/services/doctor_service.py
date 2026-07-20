import json
from datetime import datetime, UTC
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException

from app.llm.groq_client import GroqLLMService
from app.schemas.doctor import PatientOverviewResponse, ClinicalNoteCreate
from app.utils.object_id import object_id

import logging
logger = logging.getLogger("mediai.doctor")


class DoctorService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.llm = GroqLLMService()

    async def get_patient_list(self) -> list[dict]:
        """Fetch all patients for the doctor dashboard."""
        patients_cursor = self.db.users.find({"role": "patient"}, {"password_hash": 0})
        patients = await patients_cursor.to_list(100)
        
        result = []
        for p in patients:
            uid_str = str(p["_id"])
            profile_doc = await self.db.risk_profiles.find_one({"user_id": uid_str})
            profile = profile_doc.get("profile", {}) if profile_doc else {}
            
            # Extract highest risk from predictions
            risk_level = "Low"
            predictions = profile.get("risk_predictions", [])
            for pred in predictions:
                if pred.get("risk_level") == "High":
                    risk_level = "High"
                elif pred.get("risk_level") == "Medium" and risk_level == "Low":
                    risk_level = "Medium"
            
            result.append({
                "id": uid_str,
                "full_name": p.get("full_name"),
                "email": p.get("email"),
                "age": profile.get("age"),
                "gender": profile.get("gender"),
                "risk_level": risk_level,
                "chronic_conditions": profile.get("chronic_conditions", []),
            })
        return result

    async def get_patient_overview(self, patient_id: str) -> PatientOverviewResponse:
        """Fetch a comprehensive 360 view of a patient."""
        patient = await self.db.users.find_one({"_id": object_id(patient_id), "role": "patient"})
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        uid_str = str(patient["_id"])
        
        # Gather data concurrently or sequentially
        profile_doc = await self.db.risk_profiles.find_one({"user_id": uid_str})
        profile = profile_doc.get("profile", {}) if profile_doc else {}
        
        vitals = await self.db.health_timeline.find({"user_id": uid_str}).sort("date", -1).to_list(50)
        meds = await self.db.medications.find({"user_id": uid_str, "status": "Active"}).to_list(50)
        
        # Determine risk level
        risk_level = "Low"
        for pred in profile.get("risk_predictions", []):
            if pred.get("risk_level") == "High":
                risk_level = "High"
            elif pred.get("risk_level") == "Medium" and risk_level == "Low":
                risk_level = "Medium"

        return PatientOverviewResponse(
            user_id=uid_str,
            full_name=patient.get("full_name", ""),
            email=patient.get("email", ""),
            age=profile.get("age"),
            gender=profile.get("gender"),
            risk_level=risk_level,
            chronic_conditions=profile.get("chronic_conditions", []),
            allergies=profile.get("allergies", []),
            recent_vitals=[{k: v for k, v in v_doc.items() if k != "_id"} for v_doc in vitals],
            active_medications=[{k: v for k, v in m_doc.items() if k != "_id"} for m_doc in meds],
        )

    async def generate_doctor_ai_content(self, patient_id: str, task_type: str, additional_context: str | None) -> str:
        """Use Doctor AI to generate clinical content (SOAP notes, summaries, etc)."""
        overview = await self.get_patient_overview(patient_id)
        
        # Convert overview to JSON string for context
        context_data = overview.model_dump_json(indent=2)
        
        prompts = {
            "soap_note": (
                "You are an expert Clinical AI Assistant for doctors. Generate a professional SOAP note "
                "(Subjective, Objective, Assessment, Plan) based on the patient's data below."
            ),
            "clinical_summary": (
                "You are an expert Clinical AI Assistant. Generate a concise, high-level clinical summary "
                "of this patient's health status, highlighting key risks and active conditions."
            ),
            "differential_diagnosis": (
                "You are an expert Clinical AI Assistant. Based on the patient's symptoms and vitals, "
                "suggest a differential diagnosis list with rationales."
            ),
            "lab_explanation": (
                "You are an expert Clinical AI Assistant. Explain any abnormal vitals or lab results "
                "found in the patient's timeline, and suggest follow-up tests."
            )
        }
        
        system_instruction = prompts.get(task_type, "You are an expert Clinical AI Assistant.")
        if additional_context:
            system_instruction += f"\n\nDoctor's specific instructions: {additional_context}"
            
        full_prompt = f"{system_instruction}\n\nPatient Data:\n{context_data}\n\nPlease generate the requested output in Markdown format."

        if not self.llm.client:
            return "AI service is currently unavailable."
            
        try:
            response = await self.llm.client.chat.completions.create(
                model=self.llm.settings.groq_model,
                messages=[
                    {"role": "system", "content": "You are a professional Doctor AI Assistant. Output clean Markdown."},
                    {"role": "user", "content": full_prompt}
                ],
                temperature=0.2,
            )
            return response.choices[0].message.content or "No content generated."
        except Exception as e:
            logger.error("Failed to generate Doctor AI content", exc_info=True)
            raise HTTPException(status_code=500, detail="Failed to generate AI content.")

    async def save_clinical_note(self, note: ClinicalNoteCreate, doctor_id: str) -> dict:
        now = datetime.now(UTC)
        doc = {
            "patient_id": note.patient_id,
            "doctor_id": doctor_id,
            "title": note.title,
            "content": note.content,
            "note_type": note.note_type,
            "created_at": now,
        }
        result = await self.db.clinical_notes.insert_one(doc)
        doc["id"] = str(result.inserted_id)
        doc["_id"] = str(result.inserted_id)
        return doc

    async def get_clinical_notes(self, patient_id: str) -> list[dict]:
        notes = await self.db.clinical_notes.find({"patient_id": patient_id}).sort("created_at", -1).to_list(100)
        for n in notes:
            n["id"] = str(n["_id"])
            n.pop("_id", None)
        return notes
