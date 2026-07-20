from pydantic import BaseModel
from datetime import datetime

class MessageCreate(BaseModel):
    receiver_id: str
    content: str

class MessageResponse(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    content: str
    timestamp: datetime
    read_status: bool
