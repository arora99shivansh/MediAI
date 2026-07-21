from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MediAI"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    secret_key: str = Field(min_length=32)
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 14
    password_reset_expire_minutes: int = 30
    email_verification_expire_hours: int = 24

    mongodb_uri: str = "mongodb://mongo:27017"
    mongodb_database: str = "mediai"

    groq_api_key: str | None = None
    groq_model: str = "llama-3.3-70b-versatile"
    fallback_groq_model: str = "llama-3.1-8b-instant"

    embedding_model_name: str = "BAAI/bge-small-en-v1.5"
    vector_store_path: Path = Path("storage/faiss")
    upload_dir: Path = Path("storage/uploads")
    max_upload_mb: int = 25
    top_k: int = 5
    chunk_size: int = 900
    chunk_overlap: int = 150

    cors_origins: str = "http://localhost:8501,http://127.0.0.1:8501,http://localhost:3000,https://medi-ai-ochre-nine.vercel.app,https://medi-ai-git-main-arora99shivanshs-projects.vercel.app,https://medi-4djx752kz-arora99shivanshs-projects.vercel.app"
    rate_limit: str = "120/minute"
    frontend_app_url: str = "http://localhost:3000"

    payment_provider: str = "stripe"
    default_currency: str = "usd"
    stripe_secret_key: str | None = None
    stripe_publishable_key: str | None = None
    stripe_webhook_secret: str | None = None
    stripe_api_base_url: str = "https://api.stripe.com/v1"

    video_provider: str = "daily"
    daily_api_key: str | None = None
    daily_domain: str | None = None
    daily_domain_id: str | None = None
    daily_api_base_url: str = "https://api.daily.co/v1"
    consultation_duration_minutes: int = 30
    refund_window_hours: int = 24

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
