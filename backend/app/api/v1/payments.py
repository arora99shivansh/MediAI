from typing import Annotated
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database.mongo import get_db
from app.auth.dependencies import get_current_user, require_roles
from app.schemas.payment import PaymentIntentResponse, PaymentConfirmRequest, RefundRequest
from app.services.payment_service import PaymentService

router = APIRouter(tags=["Payments"])

@router.post("/intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    amount: int,
    appointment_id: str,
    user: Annotated[dict, Depends(require_roles("patient"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    """Create a payment intent for booking."""
    return await PaymentService(db).create_payment_intent(amount, appointment_id)


@router.post("/confirm")
async def confirm_payment(
    data: PaymentConfirmRequest,
    user: Annotated[dict, Depends(require_roles("patient"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
) -> dict:
    """Confirm a successful payment."""
    await PaymentService(db).confirm_payment(data.payment_id, data.appointment_id)
    return {"status": "success"}


@router.post("/refund")
async def process_refund(
    data: RefundRequest,
    user: Annotated[dict, Depends(require_roles("admin"))], # Realistically Admin or automated job
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
) -> dict:
    """Process a refund for a cancelled appointment."""
    await PaymentService(db).process_refund(data.appointment_id, data.reason)
    return {"status": "refunded"}
