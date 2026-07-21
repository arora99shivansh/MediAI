from typing import Annotated

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.dependencies import require_roles
from app.database.mongo import get_db
from app.schemas.payment import (
    PaymentCheckoutRequest,
    PaymentCheckoutResponse,
    PaymentSessionLookupResponse,
    RefundRequest,
    RefundResponse,
)
from app.services.payment_service import PaymentService

router = APIRouter(tags=["Payments"])


@router.post("/checkout-session", response_model=PaymentCheckoutResponse)
async def create_checkout_session(
    data: PaymentCheckoutRequest,
    user: Annotated[dict, Depends(require_roles("patient"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    """Create a Stripe Checkout session for an appointment."""
    return await PaymentService(db).create_checkout_session(data.appointment_id, str(user["_id"]))


@router.get("/checkout-session/{session_id}", response_model=PaymentSessionLookupResponse)
async def get_checkout_session_status(
    session_id: str,
    user: Annotated[dict, Depends(require_roles("patient"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    """Fetch and reconcile the Stripe Checkout session status."""
    _ = user
    return await PaymentService(db).get_checkout_session_status(session_id)


@router.post("/refund", response_model=RefundResponse)
async def process_refund(
    data: RefundRequest,
    user: Annotated[dict, Depends(require_roles("doctor", "admin"))],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    """Process a Stripe refund for a cancelled or rejected appointment."""
    return await PaymentService(db).process_refund(data.appointment_id, user, data.reason)
