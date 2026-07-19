import json
from datetime import datetime, UTC
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.llm.groq_client import GroqLLMService
from app.schemas.health import HealthDocumentExtraction
import logging

logger = logging.getLogger("mediai.health")

class HealthService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.llm = GroqLLMService()

    async def extract_and_store_health_data(self, user_id: str, document_id: str, filename: str, full_text: str) -> None:
        """
        Extracts structured health data from a document and saves it to MongoDB.
        Called asynchronously during document upload.
        """
        logger.info(f"Starting health extraction for document {filename}", extra={"user_id": user_id, "document_id": document_id})
        
        # Build prompt for JSON extraction
        prompt = (
            "You are a medical data extraction engine. Extract the following information from the provided medical document text.\n"
            "Respond ONLY with a valid JSON object matching this schema exactly:\n"
            "{\n"
            '  "date_of_report": "YYYY-MM-DD or null",\n'
            '  "medications": [{"name": "string", "dosage": "string", "frequency": "string", "duration": "string or null", "reason": "string or null"}],\n'
            '  "vitals": [{"name": "string", "value": "string", "unit": "string or null", "status": "string or null"}],\n'
            '  "conditions": [{"name": "string", "status": "string or null"}],\n'
            '  "summary": "1-2 sentence summary"\n'
            "}\n\n"
            f"Document Text:\n{full_text[:6000]}" # Truncate to avoid context limits
        )
        
        # We inject a specific system prompt for JSON
        try:
            # We bypass the default messages builder in GroqLLMService to enforce JSON format
            if self.llm.client is None:
                return
            
            response = await self.llm.client.chat.completions.create(
                model=self.llm.settings.groq_model,
                messages=[
                    {"role": "system", "content": "You are a clinical data extraction AI. Always output valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.0,
            )
            
            result_json = response.choices[0].message.content
            if not result_json:
                return
                
            extracted_data = HealthDocumentExtraction.model_validate_json(result_json)
            
            now = datetime.now(UTC)
            
            # Save to health_memory
            memory_doc = {
                "user_id": user_id,
                "document_id": document_id,
                "filename": filename,
                "extraction": extracted_data.model_dump(),
                "created_at": now
            }
            await self.db.health_memory.insert_one(memory_doc)
            
            # Save vitals to timeline
            timeline_docs = []
            for vital in extracted_data.vitals:
                timeline_docs.append({
                    "user_id": user_id,
                    "document_id": document_id,
                    "vital_name": vital.name,
                    "value": vital.value,
                    "unit": vital.unit,
                    "status": vital.status,
                    "date": extracted_data.date_of_report or now.strftime("%Y-%m-%d"),
                    "created_at": now
                })
            
            if timeline_docs:
                await self.db.health_timeline.insert_many(timeline_docs)
                
            # Save medications
            med_docs = []
            for med in extracted_data.medications:
                med_docs.append({
                    "user_id": user_id,
                    "document_id": document_id,
                    "name": med.name,
                    "dosage": med.dosage,
                    "frequency": med.frequency,
                    "duration": med.duration,
                    "reason": med.reason,
                    "status": "Active",
                    "date_prescribed": extracted_data.date_of_report or now.strftime("%Y-%m-%d"),
                    "created_at": now
                })
            
            if med_docs:
                await self.db.medications.insert_many(med_docs)
                
            logger.info(f"Successfully extracted {len(med_docs)} meds and {len(timeline_docs)} vitals", extra={"user_id": user_id})
            
            # Phase 2: Update Digital Twin and Risks
            await self._update_digital_twin(user_id, extracted_data, now)
            
        except Exception as e:
            logger.error("Failed to extract health data", exc_info=True, extra={"user_id": user_id, "document_id": document_id})

    async def _update_digital_twin(self, user_id: str, recent_data: HealthDocumentExtraction, now: datetime) -> None:
        """
        Reads the user's current digital twin, merges the new data, and generates risk predictions.
        """
        current_profile = await self.db.risk_profiles.find_one({"user_id": user_id})
        profile_context = current_profile.get("profile", {}) if current_profile else {}
        
        prompt = (
            "You are a clinical AI profiling engine. You are updating a patient's 'Digital Twin'.\n"
            "Below is their PREVIOUS profile data, followed by NEW data extracted from a recent upload.\n"
            "Merge this information intelligently. Then, based on their complete profile, evaluate their health risks (e.g., Diabetes, Hypertension, Kidney Disease) and recommend 3-5 actionable follow-up steps.\n\n"
            "Respond ONLY with a valid JSON object matching this schema exactly:\n"
            "{\n"
            '  "age": int or null,\n'
            '  "gender": "string or null",\n'
            '  "chronic_conditions": ["string"],\n'
            '  "allergies": ["string"],\n'
            '  "lifestyle_factors": ["string"],\n'
            '  "family_history": ["string"],\n'
            '  "risk_predictions": [{"condition": "string", "risk_level": "Low"|"Medium"|"High", "reasoning": "string"}],\n'
            '  "follow_up_actions": [{"type": "string", "description": "string"}]\n'
            "}\n\n"
            f"PREVIOUS PROFILE:\n{json.dumps(profile_context, default=str)}\n\n"
            f"NEW EXTRACTED DATA:\n{recent_data.model_dump_json()}"
        )
        
        try:
            from app.schemas.health import DigitalTwinUpdate
            response = await self.llm.client.chat.completions.create(
                model=self.llm.settings.groq_model,
                messages=[
                    {"role": "system", "content": "You are a clinical AI profiling engine. Always output valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.0,
            )
            
            result_json = response.choices[0].message.content
            if not result_json:
                return
                
            updated_twin = DigitalTwinUpdate.model_validate_json(result_json)
            
            await self.db.risk_profiles.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "profile": updated_twin.model_dump(),
                        "updated_at": now
                    }
                },
                upsert=True
            )
            logger.info("Successfully updated digital twin and risk predictions", extra={"user_id": user_id})
            
        except Exception as e:
            logger.error("Failed to update digital twin", exc_info=True, extra={"user_id": user_id})

