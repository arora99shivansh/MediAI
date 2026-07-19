from pydantic import BaseModel


class DashboardMetrics(BaseModel):
    total_users: int
    active_users: int
    uploaded_files: int
    queries_per_day: list[dict]
    llm_usage: dict
    token_usage: dict
    storage_usage: dict
    most_asked_questions: list[dict]
    top_diseases: list[dict]
    top_medicines: list[dict]
    response_time_ms: list[dict]
    api_latency_ms: list[dict]
