from datetime import UTC, datetime, timedelta
from secrets import token_urlsafe

from jose import JWTError, jwt

from app.config.settings import get_settings


def create_access_token(subject: str, role: str) -> str:
    settings = get_settings()
    expires_at = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "role": role, "type": "access", "exp": expires_at}
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def create_refresh_token() -> str:
    return token_urlsafe(48)


def decode_access_token(token: str) -> dict:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc
    if payload.get("type") != "access" or "sub" not in payload:
        raise ValueError("Invalid token type")
    return payload
