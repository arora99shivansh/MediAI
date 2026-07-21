from datetime import UTC, datetime
import logging
from typing import Any

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config.settings import Settings, get_settings
from app.services.stripe_gateway import StripeGateway
from app.utils.object_id import object_id

logger = logging.getLogger("mediai.payments")


class PaymentService:
    def __init__(self, db: AsyncIOMotorDatabase, settings: Settings | None = None):
        self.db = db
        self.settings = settings or get_settings()
        self.gateway = StripeGateway(self.settings)

    async def _get_appointment(self, appointment_id: str) -> dict:
        appointment = await self.db.appointments.find_one({"_id": object_id(appointment_id)})
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return appointment

    async def create_checkout_session(self, appointment_id: str, patient_id: str) -> dict:
        appointment = await self._get_appointment(appointment_id)
        if appointment.get("patient_id") != patient_id:
            raise HTTPException(status_code=403, detail="Not authorized to pay for this appointment")
        if appointment.get("status") != "pending_payment":
            raise HTTPException(status_code=400, detail="This appointment is not awaiting payment")

        patient = await self.db.users.find_one({"_id": object_id(patient_id)})
        doctor = await self.db.users.find_one({"_id": object_id(appointment["doctor_id"])})
        if not patient or not doctor:
            raise HTTPException(status_code=404, detail="Unable to resolve booking participants")

        amount = int(appointment.get("fee_amount") or 0)
        currency = (appointment.get("currency") or self.settings.default_currency).lower()
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Appointment amount is invalid")

        success_url = (
            f"{self.settings.frontend_app_url}/patient/appointments"
            "?payment=success&session_id={CHECKOUT_SESSION_ID}"
        )
        cancel_url = (
            f"{self.settings.frontend_app_url}/patient/appointments"
            f"?payment=cancelled&appointment_id={appointment_id}"
        )

        session = await self.gateway.create_checkout_session(
            appointment_id=appointment_id,
            patient_email=patient["email"],
            patient_name=patient.get("full_name") or "Patient",
            doctor_name=doctor.get("full_name") or "Doctor",
            amount=amount,
            currency=currency,
            success_url=success_url,
            cancel_url=cancel_url,
        )

        payment_doc = {
            "appointment_id": appointment_id,
            "patient_id": patient_id,
            "doctor_id": appointment["doctor_id"],
            "provider": "stripe",
            "provider_session_id": session["id"],
            "provider_payment_id": session.get("payment_intent"),
            "checkout_url": session.get("url"),
            "amount": amount,
            "currency": currency,
            "status": session.get("payment_status") or "unpaid",
            "session_status": session.get("status") or "open",
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        }
        insert_result = await self.db.payments.insert_one(payment_doc)
        payment_id = str(insert_result.inserted_id)

        await self.db.appointments.update_one(
            {"_id": appointment["_id"]},
            {
                "$set": {
                    "latest_payment_record_id": payment_id,
                    "payment_provider": "stripe",
                    "updated_at": datetime.now(UTC),
                }
            },
        )

        return {
            "checkout_url": session["url"],
            "session_id": session["id"],
            "amount": amount,
            "currency": currency,
            "payment_id": payment_id,
            "provider": "stripe",
            "publishable_key": self.settings.stripe_publishable_key,
        }

    async def _apply_checkout_session(self, session: dict[str, Any]) -> dict[str, Any]:
        appointment_id = (
            session.get("metadata", {}).get("appointment_id")
            or session.get("client_reference_id")
        )
        if not appointment_id:
            raise HTTPException(status_code=400, detail="Stripe session missing appointment metadata")

        payment_update = {
            "provider_payment_id": session.get("payment_intent"),
            "status": session.get("payment_status") or "unpaid",
            "session_status": session.get("status") or "open",
            "checkout_url": session.get("url"),
            "amount": session.get("amount_total"),
            "currency": (session.get("currency") or self.settings.default_currency).lower(),
            "updated_at": datetime.now(UTC),
        }

        await self.db.payments.update_one(
            {"provider_session_id": session["id"]},
            {"$set": payment_update},
        )

        payment_status = session.get("payment_status") or "unpaid"
        appointment_status = "pending" if payment_status == "paid" else "pending_payment"
        await self.db.appointments.update_one(
            {"_id": object_id(appointment_id)},
            {
                "$set": {
                    "payment_id": session.get("payment_intent"),
                    "payment_status": payment_status,
                    "status": appointment_status,
                    "updated_at": datetime.now(UTC),
                }
            },
        )

        return {
            "appointment_id": appointment_id,
            "payment_status": payment_status,
            "appointment_status": appointment_status,
            "provider": "stripe",
            "provider_session_id": session["id"],
            "provider_payment_id": session.get("payment_intent"),
            "checkout_url": session.get("url"),
            "amount": session.get("amount_total"),
            "currency": (session.get("currency") or self.settings.default_currency).lower(),
            "refund_status": None,
        }

    async def get_checkout_session_status(self, session_id: str) -> dict[str, Any]:
        session = await self.gateway.retrieve_checkout_session(session_id)
        status = await self._apply_checkout_session(session)
        status["session_id"] = session_id
        return status

    async def process_refund(self, appointment_id: str, actor: dict, reason: str | None = None) -> dict[str, Any]:
        appointment = await self._get_appointment(appointment_id)
        actor_id = str(actor["_id"])
        actor_role = actor.get("role")
        if actor_role == "doctor" and appointment.get("doctor_id") != actor_id:
            raise HTTPException(status_code=403, detail="Not authorized to refund this appointment")
        if actor_role not in {"doctor", "admin"}:
            raise HTTPException(status_code=403, detail="Not authorized to refund this appointment")

        payment = await self.db.payments.find_one(
            {"appointment_id": appointment_id},
            sort=[("created_at", -1)],
        )
        if not payment or not payment.get("provider_payment_id"):
            raise HTTPException(status_code=400, detail="No captured payment found for this appointment")
        if payment.get("status") != "paid":
            raise HTTPException(status_code=400, detail="Payment is not in a refundable state")

        refund = await self.gateway.create_refund(
            payment_intent_id=payment["provider_payment_id"],
            reason=reason,
        )
        refund_status = refund.get("status") or "pending"

        await self.db.payments.update_one(
            {"_id": payment["_id"]},
            {
                "$set": {
                    "refund_id": refund.get("id"),
                    "refund_status": refund_status,
                    "refund_reason": reason,
                    "status": "refunded" if refund_status == "succeeded" else payment["status"],
                    "updated_at": datetime.now(UTC),
                }
            },
        )
        await self.db.appointments.update_one(
            {"_id": appointment["_id"]},
            {
                "$set": {
                    "status": "cancelled",
                    "refund_status": refund_status,
                    "updated_at": datetime.now(UTC),
                }
            },
        )
        return {
            "status": "refunded" if refund_status == "succeeded" else "refund_in_progress",
            "refund_id": refund.get("id"),
            "refund_status": refund_status,
        }

    async def handle_stripe_webhook(self, payload: bytes, signature_header: str | None) -> dict[str, str]:
        event = self.gateway.verify_webhook_signature(payload, signature_header)
        event_type = event.get("type")
        event_object = event.get("data", {}).get("object", {})

        if event_type in {"checkout.session.completed", "checkout.session.async_payment_succeeded"}:
            await self._apply_checkout_session(event_object)
        elif event_type == "checkout.session.expired":
            await self.db.payments.update_one(
                {"provider_session_id": event_object.get("id")},
                {"$set": {"session_status": "expired", "updated_at": datetime.now(UTC)}},
            )
        elif event_type == "payment_intent.payment_failed":
            provider_payment_id = event_object.get("id")
            payment = await self.db.payments.find_one({"provider_payment_id": provider_payment_id})
            if payment:
                await self.db.payments.update_one(
                    {"_id": payment["_id"]},
                    {
                        "$set": {
                            "status": "failed",
                            "failure_message": event_object.get("last_payment_error", {}).get("message"),
                            "updated_at": datetime.now(UTC),
                        }
                    },
                )
                await self.db.appointments.update_one(
                    {"_id": object_id(payment["appointment_id"])},
                    {"$set": {"payment_status": "failed", "status": "pending_payment", "updated_at": datetime.now(UTC)}},
                )
        elif event_type == "charge.refunded":
            payment_intent = event_object.get("payment_intent")
            payment = await self.db.payments.find_one({"provider_payment_id": payment_intent})
            if payment:
                await self.db.payments.update_one(
                    {"_id": payment["_id"]},
                    {"$set": {"status": "refunded", "refund_status": "succeeded", "updated_at": datetime.now(UTC)}},
                )
                await self.db.appointments.update_one(
                    {"_id": object_id(payment["appointment_id"])},
                    {"$set": {"status": "cancelled", "refund_status": "succeeded", "updated_at": datetime.now(UTC)}},
                )

        return {"status": "received"}
