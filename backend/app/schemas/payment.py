from pydantic import BaseModel
from typing import Optional

class PaymentCheckoutRequest(BaseModel):
    appointment_id: str


class PaymentCheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str
    amount: int
    currency: str
    payment_id: str
    provider: str
    publishable_key: str | None = None


class PaymentStatusResponse(BaseModel):
    appointment_id: str
    payment_status: str
    appointment_status: str
    provider: str
    provider_session_id: str | None = None
    provider_payment_id: str | None = None
    checkout_url: str | None = None
    amount: int | None = None
    currency: str | None = None
    refund_status: str | None = None


class PaymentSessionLookupResponse(PaymentStatusResponse):
    session_id: str

class RefundRequest(BaseModel):
    appointment_id: str
    reason: Optional[str] = None


class RefundResponse(BaseModel):
    status: str
    refund_id: str | None = None
    refund_status: str | None = None
