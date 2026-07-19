from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DocumentRead(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="_id")
    filename: str
    content_type: str
    size_bytes: int
    chunk_count: int
    created_at: datetime


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    top_k: int = Field(default=5, ge=1, le=10)


class SearchResult(BaseModel):
    document_id: str
    filename: str
    page: int | None = None
    score: float
    text: str
