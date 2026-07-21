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

    async def search_doctors(self, city: str | None = None, specialization: str | None = None) -> list[dict]:
        """Search for doctors."""
        query: dict[str, Any] = {"role": "doctor"}
        if city:
            query["city"] = {"$regex": f"^{city}$", "$options": "i"}
        if specialization:
            query["specialization"] = {"$regex": f"^{specialization}$", "$options": "i"}
            
        cursor = self.db.users.find(query, {"password_hash": 0})
        doctors = await cursor.to_list(100)
        
        result = []
        for doc in doctors:
            doc["_id"] = str(doc["_id"])
            result.append(doc)
        return result

    async def get_doctor_profile(self, doctor_id: str) -> dict:
        """Get profile of a doctor and calculate available slots for the next 7 days."""
        doctor = await self.db.users.find_one({"_id": object_id(doctor_id), "role": "doctor"})
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
            
        doctor["_id"] = str(doctor["_id"])
        
        # Calculate availability for the next 7 days based on weekly schedule
        import datetime
        from datetime import timedelta
        
        schedule = doctor.get("availability", {})
        available_dates = []
        time_slots_by_date = {}
        
        if schedule:
            today = datetime.datetime.now()
            # Find booked appointments to exclude them
            booked_cursor = self.db.appointments.find({
                "doctor_id": doctor["_id"],
                "status": {"$in": ["pending", "confirmed", "pending_payment"]}
            })
            booked_appts = await booked_cursor.to_list(500)
            booked_map = {} # date_string: set of booked slots
            for b in booked_appts:
                if b["date"] not in booked_map:
                    booked_map[b["date"]] = set()
                booked_map[b["date"]].add(b["slot"])
                
            for i in range(1, 8):
                d = today + timedelta(days=i)
                day_name = d.strftime("%A")
                date_str = d.strftime("%Y-%m-%d")
                
                day_slots = schedule.get(day_name, [])
                if day_slots:
                    # Filter out already booked slots
                    booked_for_day = booked_map.get(date_str, set())
                    free_slots = [s for s in day_slots if s not in booked_for_day]
                    
                    if free_slots:
                        available_dates.append(date_str)
                        time_slots_by_date[date_str] = free_slots
                        
        doctor["available_dates"] = available_dates
        doctor["time_slots_by_date"] = time_slots_by_date
        
        return doctor

    async def update_doctor_profile(self, doctor_id: str, data: Any) -> dict:
        """Update doctor's public profile and weekly schedule."""
        update_data = data.model_dump(exclude_unset=True)
        
        if not update_data:
            return {"status": "no changes"}
            
        result = await self.db.users.update_one(
            {"_id": object_id(doctor_id), "role": "doctor"},
            {"$set": update_data}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Doctor not found")
            
        return {"status": "success"}

    async def get_patient_list(self, doctor_id: str | None = None) -> list[dict]:
        """Fetch patients for the doctor dashboard (only assigned ones if doctor_id provided)."""
        query = {"role": "patient"}
        if doctor_id:
            query["assigned_doctor_id"] = doctor_id
            
        patients_cursor = self.db.users.find(query, {"password_hash": 0})
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

    async def search_all_patients(self) -> list[dict]:
        """Fetch all patients for global directory search."""
        # Reuse existing logic without filtering by doctor
        return await self.get_patient_list(doctor_id=None)

    async def assign_patient(self, doctor_id: str, patient_id: str) -> dict:
        """Assign a patient to a doctor."""
        p_obj = object_id(patient_id)
        d_obj = object_id(doctor_id)
        
        patient = await self.db.users.find_one({"_id": p_obj, "role": "patient"})
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
            
        await self.db.users.update_one({"_id": p_obj}, {"$set": {"assigned_doctor_id": doctor_id}})
        await self.db.users.update_one({"_id": d_obj, "role": "doctor"}, {"$addToSet": {"assigned_patient_ids": patient_id}})
        return {"status": "success", "message": f"Patient {patient.get('full_name')} assigned successfully"}

    async def get_patient_overview(self, patient_id: str, doctor_id: str | None = None) -> PatientOverviewResponse:
        """Fetch a comprehensive 360 view of a patient."""
        query = {"_id": object_id(patient_id), "role": "patient"}
        if doctor_id:
            query["assigned_doctor_id"] = doctor_id
            
        patient = await self.db.users.find_one(query)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found or not assigned to you")

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

    async def generate_doctor_ai_content(self, patient_id: str, task_type: str, additional_context: str | None, doctor_id: str | None = None) -> str:
        """Use Doctor AI to generate clinical content with RAG context."""
        overview = await self.get_patient_overview(patient_id, doctor_id)
        
        # Convert overview to JSON string for context
        context_data = overview.model_dump_json(indent=2)
        
        # Perform RAG search for additional context
        from app.rag.rag_service import RAGService
        rag = RAGService(self.db)
        
        # Formulate query based on task and context
        search_query = f"{task_type} {additional_context or ''} {overview.chronic_conditions}"
        matches = await rag.search(search_query, patient_id, top_k=5)
        
        doc_context = ""
        if matches:
            doc_context = "\n\nRelevant Medical Evidence from Patient Records:\n" + "\n".join(
                f"- Source ({m.get('filename')} p.{m.get('page')}): {m.get('text')}" for m in matches
            )
        
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
            
        full_prompt = f"{system_instruction}\n\nStructured Patient Data:\n{context_data}{doc_context}\n\nPlease generate the requested output in Markdown format."

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

    async def save_clinical_note(self, note: ClinicalNoteCreate, creator_id: str, doctor_id: str | None = None) -> dict:
        # Verify access by trying to fetch the overview
        await self.get_patient_overview(note.patient_id, doctor_id)
        
        now = datetime.now(UTC)
        doc = {
            "patient_id": note.patient_id,
            "doctor_id": creator_id,
            "title": note.title,
            "content": note.content,
            "note_type": note.note_type,
            "created_at": now,
        }
        result = await self.db.clinical_notes.insert_one(doc)
        doc["id"] = str(result.inserted_id)
        doc["_id"] = str(result.inserted_id)
        return doc

    async def get_clinical_notes(self, patient_id: str, doctor_id: str | None = None) -> list[dict]:
        # Verify access
        await self.get_patient_overview(patient_id, doctor_id)
        
        notes = await self.db.clinical_notes.find({"patient_id": patient_id}).sort("created_at", -1).to_list(100)
        return [{**n, "id": str(n.pop("_id", ""))} for n in notes]
