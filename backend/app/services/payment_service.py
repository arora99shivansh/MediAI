import uuid
from datetime import datetime, UTC
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException
from app.utils.object_id import object_id

import logging
logger = logging.getLogger("mediai.payments")

class PaymentService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def create_payment_intent(self, amount: int, appointment_id: str) -> dict:
        """Create a mock payment intent."""
        # In a real app, this would call Stripe/Razorpay
        payment_id = f"pi_mock_{uuid.uuid4().hex[:12]}"
        
        await self.db.payments.insert_one({
            "payment_id": payment_id,
            "appointment_id": appointment_id,
            "amount": amount,
            "currency": "usd",
            "status": "pending",
            "created_at": datetime.now(UTC)
        })
        
        return {
            "client_secret": f"secret_{payment_id}",
            "amount": amount,
            "currency": "usd",
            "payment_id": payment_id
        }

    async def confirm_payment(self, payment_id: str, appointment_id: str) -> bool:
        """Confirm the mock payment."""
        payment = await self.db.payments.find_one_and_update(
            {"payment_id": payment_id},
            {"$set": {"status": "succeeded", "updated_at": datetime.now(UTC)}}
        )
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
            
        await self.db.appointments.update_one(
            {"_id": object_id(appointment_id)},
            {"$set": {"status": "confirmed", "payment_id": payment_id}}
        )
        return True

    async def process_refund(self, appointment_id: str, reason: str = None) -> bool:
        """Process a mock refund based on the appointment ID."""
        appointment = await self.db.appointments.find_one({"_id": object_id(appointment_id)})
        if not appointment or not appointment.get("payment_id"):
            logger.error(f"Cannot refund: missing payment_id for appointment {appointment_id}")
            return False
            
        payment_id = appointment["payment_id"]
        
        # Mock refund API call
        await self.db.payments.update_one(
            {"payment_id": payment_id},
            {"$set": {"status": "refunded", "refund_reason": reason, "refunded_at": datetime.now(UTC)}}
        )
        
        await self.db.appointments.update_one(
            {"_id": object_id(appointment_id)},
            {"$set": {"status": "cancelled", "refund_status": "refunded"}}
        )
        return True
