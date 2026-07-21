from datetime import datetime, UTC
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException
from app.utils.object_id import object_id
from app.schemas.appointment import AppointmentCreate

import logging
logger = logging.getLogger("mediai.appointments")

class AppointmentService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def book_appointment(self, patient_id: str, data: AppointmentCreate) -> dict:
        """Create a new pending appointment."""
        # Check double booking
        existing = await self.db.appointments.find_one({
            "doctor_id": data.doctor_id,
            "date": data.date,
            "slot": data.slot,
            "status": {"$in": ["pending", "confirmed", "pending_payment"]}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Slot already booked")
            
        doc = {
            "patient_id": patient_id,
            "doctor_id": data.doctor_id,
            "date": data.date,
            "slot": data.slot,
            "status": "pending_payment",
            "created_at": datetime.now(UTC)
        }
        
        result = await self.db.appointments.insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        return doc

    async def get_patient_appointments(self, patient_id: str) -> list[dict]:
        """Fetch all appointments for a patient."""
        cursor = self.db.appointments.find({"patient_id": patient_id}).sort("created_at", -1)
        appointments = await cursor.to_list(100)
        
        result = []
        for appt in appointments:
            appt["id"] = str(appt.pop("_id"))
            # Fetch doctor name
            doctor = await self.db.users.find_one({"_id": object_id(appt["doctor_id"])})
            appt["doctor_name"] = doctor.get("full_name") if doctor else "Unknown Doctor"
            result.append(appt)
            
        return result

    async def get_doctor_appointments(self, doctor_id: str) -> list[dict]:
        """Fetch all appointments for a doctor."""
        cursor = self.db.appointments.find({"doctor_id": doctor_id, "status": {"$in": ["confirmed", "pending", "cancelled"]}}).sort("created_at", -1)
        appointments = await cursor.to_list(100)
        
        result = []
        for appt in appointments:
            appt["id"] = str(appt.pop("_id"))
            # Fetch patient name
            patient = await self.db.users.find_one({"_id": object_id(appt["patient_id"])})
            appt["patient_name"] = patient.get("full_name") if patient else "Unknown Patient"
            result.append(appt)
            
        return result

    async def update_status(self, appointment_id: str, doctor_id: str, status: str) -> bool:
        """Doctor updates appointment status (accept/reject)."""
        result = await self.db.appointments.update_one(
            {"_id": object_id(appointment_id), "doctor_id": doctor_id},
            {"$set": {"status": status, "updated_at": datetime.now(UTC)}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Appointment not found or unauthorized")
        return True
