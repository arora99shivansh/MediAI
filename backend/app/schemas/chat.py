from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    chat_id: str | None = None
    language: str = "auto"
    top_k: int = Field(default=5, ge=1, le=10)
    stream: bool = True


class ChatMessage(BaseModel):
    role: str
    content: str
    created_at: datetime
    citations: list[dict] = []


class ChatSummary(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="_id")
    title: str
    pinned: bool = False
    updated_at: datetime
    message_count: int


class RenameChatRequest(BaseModel):
    title: str = Field(min_length=1, max_length=120)
