from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PaymentIntentResponse(BaseModel):
    client_secret: str
    amount: int
    currency: str
    payment_id: str

class PaymentConfirmRequest(BaseModel):
    payment_id: str
    appointment_id: str

class RefundRequest(BaseModel):
    appointment_id: str
    reason: Optional[str] = None
