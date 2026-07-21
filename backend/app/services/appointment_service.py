from datetime import UTC, datetime
import logging

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config.settings import get_settings
from app.schemas.appointment import AppointmentCreate
from app.utils.object_id import object_id

logger = logging.getLogger("mediai.appointments")


class AppointmentService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def book_appointment(self, patient_id: str, data: AppointmentCreate) -> dict:
        """Create a new payment-pending appointment."""
        doctor = await self.db.users.find_one({"_id": object_id(data.doctor_id), "role": "doctor"})
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")

        existing = await self.db.appointments.find_one(
            {
                "doctor_id": data.doctor_id,
                "date": data.date,
                "slot": data.slot,
                "status": {"$in": ["pending", "confirmed", "pending_payment"]},
            }
        )
        if existing:
            raise HTTPException(status_code=400, detail="Slot already booked")

        settings = get_settings()
        fee_amount = int(round((doctor.get("consultation_fee") or 50) * 100))
        doc = {
            "patient_id": patient_id,
            "doctor_id": data.doctor_id,
            "date": data.date,
            "slot": data.slot,
            "status": "pending_payment",
            "payment_status": "unpaid",
            "fee_amount": fee_amount,
            "currency": settings.default_currency.lower(),
            "created_at": datetime.now(UTC),
        }

        result = await self.db.appointments.insert_one(doc)
        doc["id"] = str(result.inserted_id)
        return doc

    async def get_patient_appointments(self, patient_id: str) -> list[dict]:
        cursor = self.db.appointments.find({"patient_id": patient_id}).sort("created_at", -1)
        appointments = await cursor.to_list(100)

        result = []
        for appointment in appointments:
            appointment["id"] = str(appointment.pop("_id"))
            doctor = await self.db.users.find_one({"_id": object_id(appointment["doctor_id"])})
            appointment["doctor_name"] = doctor.get("full_name") if doctor else "Unknown Doctor"
            result.append(appointment)
        return result

    async def get_doctor_appointments(self, doctor_id: str) -> list[dict]:
        cursor = self.db.appointments.find(
            {"doctor_id": doctor_id, "status": {"$in": ["pending_payment", "pending", "confirmed", "cancelled", "rejected"]}}
        ).sort("created_at", -1)
        appointments = await cursor.to_list(100)

        result = []
        for appointment in appointments:
            appointment["id"] = str(appointment.pop("_id"))
            patient = await self.db.users.find_one({"_id": object_id(appointment["patient_id"])})
            appointment["patient_name"] = patient.get("full_name") if patient else "Unknown Patient"
            result.append(appointment)
        return result

    async def update_status(self, appointment_id: str, doctor_id: str, status: str) -> bool:
        appointment = await self.db.appointments.find_one({"_id": object_id(appointment_id), "doctor_id": doctor_id})
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found or unauthorized")
        if status == "confirmed" and appointment.get("payment_status") != "paid":
            raise HTTPException(status_code=400, detail="Only paid appointments can be confirmed")

        await self.db.appointments.update_one(
            {"_id": appointment["_id"], "doctor_id": doctor_id},
            {"$set": {"status": status, "updated_at": datetime.now(UTC)}},
        )
        return True
