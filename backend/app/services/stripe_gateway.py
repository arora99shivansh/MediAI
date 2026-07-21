import hashlib
import hmac
import json
import logging
import time
from collections.abc import Mapping
from typing import Any

import httpx
from fastapi import HTTPException

from app.config.settings import Settings, get_settings

logger = logging.getLogger("mediai.stripe")


class StripeGateway:
    def __init__(self, settings: Settings | None = None):
        self.settings = settings or get_settings()

    def _require_secret_key(self) -> str:
        if not self.settings.stripe_secret_key:
            raise HTTPException(status_code=503, detail="Stripe is not configured")
        return self.settings.stripe_secret_key

    async def _request(
        self,
        method: str,
        path: str,
        *,
        data: Mapping[str, Any] | None = None,
        params: Mapping[str, Any] | None = None,
    ) -> dict[str, Any]:
        secret_key = self._require_secret_key()
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(
                method,
                f"{self.settings.stripe_api_base_url}{path}",
                data=data,
                params=params,
                headers={
                    "Authorization": f"Bearer {secret_key}",
                },
            )

        if response.status_code >= 400:
            detail = response.text
            try:
                payload = response.json()
                detail = payload.get("error", {}).get("message", detail)
            except ValueError:
                pass
            logger.error("Stripe request failed: %s %s", path, detail)
            raise HTTPException(status_code=502, detail="Stripe request failed")

        return response.json()

    async def create_checkout_session(
        self,
        *,
        appointment_id: str,
        patient_email: str,
        patient_name: str,
        doctor_name: str,
        amount: int,
        currency: str,
        success_url: str,
        cancel_url: str,
    ) -> dict[str, Any]:
        return await self._request(
            "POST",
            "/checkout/sessions",
            data={
                "mode": "payment",
                "client_reference_id": appointment_id,
                "customer_email": patient_email,
                "success_url": success_url,
                "cancel_url": cancel_url,
                "billing_address_collection": "auto",
                "payment_method_collection": "always",
                "invoice_creation[enabled]": "true",
                "metadata[appointment_id]": appointment_id,
                "metadata[patient_email]": patient_email,
                "payment_intent_data[metadata][appointment_id]": appointment_id,
                "payment_intent_data[metadata][patient_name]": patient_name,
                "payment_intent_data[metadata][doctor_name]": doctor_name,
                "line_items[0][quantity]": "1",
                "line_items[0][price_data][currency]": currency,
                "line_items[0][price_data][unit_amount]": str(amount),
                "line_items[0][price_data][product_data][name]": f"DoorDoctor consultation with {doctor_name}",
                "line_items[0][price_data][product_data][description]": f"Telemedicine appointment for {patient_name}",
            },
        )

    async def retrieve_checkout_session(self, session_id: str) -> dict[str, Any]:
        return await self._request(
            "GET",
            f"/checkout/sessions/{session_id}",
            params={"expand[]": ["payment_intent"]},
        )

    async def create_refund(self, *, payment_intent_id: str, reason: str | None = None) -> dict[str, Any]:
        data: dict[str, Any] = {"payment_intent": payment_intent_id}
        if reason:
            data["metadata[reason]"] = reason
        return await self._request("POST", "/refunds", data=data)

    def verify_webhook_signature(self, payload: bytes, signature_header: str | None) -> dict[str, Any]:
        secret = self.settings.stripe_webhook_secret
        if not secret or not signature_header:
            raise HTTPException(status_code=400, detail="Missing Stripe webhook signature")

        timestamp = ""
        signatures: list[str] = []
        for item in signature_header.split(","):
            key, _, value = item.partition("=")
            if key == "t":
                timestamp = value
            elif key == "v1":
                signatures.append(value)

        if not timestamp or not signatures:
            raise HTTPException(status_code=400, detail="Malformed Stripe signature")

        current_time = int(time.time())
        if abs(current_time - int(timestamp)) > 300:
            raise HTTPException(status_code=400, detail="Expired Stripe signature")

        signed_payload = f"{timestamp}.{payload.decode('utf-8')}".encode("utf-8")
        expected = hmac.new(secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()
        if not any(hmac.compare_digest(expected, signature) for signature in signatures):
            raise HTTPException(status_code=400, detail="Invalid Stripe signature")

        try:
            return json.loads(payload.decode("utf-8"))
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail="Invalid Stripe payload") from exc
