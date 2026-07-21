from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from datetime import datetime, UTC
import logging

from app.database.mongo import get_db
from app.api.v1.websocket import manager
from app.services.payment_service import PaymentService

logger = logging.getLogger("mediai.webhooks")
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

class VitalPayload(BaseModel):
    patient_id: str
    vital_name: str
    value: str
    unit: str
    status: str = "Normal"

@router.post("/vitals")
async def ingest_vitals(payload: VitalPayload, request: Request):
    db_gen = get_db()
    db = await db_gen.__anext__()
    now = datetime.now(UTC)
    
    doc = {
        "user_id": payload.patient_id,
        "vital_name": payload.vital_name,
        "value": payload.value,
        "unit": payload.unit,
        "status": payload.status,
        "date": now.strftime("%Y-%m-%d"),
        "created_at": now
    }
    
    await db.health_timeline.insert_one(doc)
    logger.info(f"Ingested vital {payload.vital_name} for patient {payload.patient_id}")
    
    # Broadcast in real-time to any connected clients
    await manager.broadcast_vital(payload.patient_id, doc)
    
    return {"status": "success", "message": "Vital synced and broadcasted"}


@router.post("/stripe")
async def stripe_webhook(request: Request):
    db_gen = get_db()
    db = await db_gen.__anext__()
    payload = await request.body()
    signature = request.headers.get("Stripe-Signature")
    return await PaymentService(db).handle_stripe_webhook(payload, signature)
