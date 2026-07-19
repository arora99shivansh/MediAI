from datetime import UTC, datetime, timedelta
from hashlib import sha256
from secrets import token_urlsafe

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from app.auth.jwt import create_access_token, create_refresh_token
from app.config.settings import get_settings
from app.schemas.auth import RegisterRequest
from app.utils.object_id import object_id, serialize_document
from app.utils.password import hash_password, verify_password


def token_hash(token: str) -> str:
    return sha256(token.encode("utf-8")).hexdigest()


class AuthService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.settings = get_settings()

    async def register(self, payload: RegisterRequest) -> tuple[dict, str]:
        now = datetime.now(UTC)
        verification_token = token_urlsafe(40)
        user = {
            "email": payload.email.lower(),
            "full_name": payload.full_name.strip(),
            "role": payload.role.value,
            "password_hash": hash_password(payload.password),
            "is_verified": False,
            "disabled": False,
            "verification_token_hash": token_hash(verification_token),
            "verification_expires_at": now + timedelta(hours=self.settings.email_verification_expire_hours),
            "created_at": now,
            "updated_at": now,
            "last_login_at": None,
        }
        try:
            result = await self.db.users.insert_one(user)
        except DuplicateKeyError as exc:
            raise HTTPException(status_code=409, detail="Email is already registered") from exc
        user["_id"] = result.inserted_id
        return serialize_document(user), verification_token

    async def authenticate(self, email: str, password: str) -> tuple[dict, str, str]:
        user = await self.db.users.find_one({"email": email.lower(), "disabled": {"$ne": True}})
        if user is None or not verify_password(password, user["password_hash"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        await self.db.users.update_one({"_id": user["_id"]}, {"$set": {"last_login_at": datetime.now(UTC)}})
        access_token = create_access_token(str(user["_id"]), user["role"])
        refresh_token = await self.create_session(str(user["_id"]))
        return serialize_document(user), access_token, refresh_token

    async def create_session(self, user_id: str) -> str:
        refresh_token = create_refresh_token()
        expires_at = datetime.now(UTC) + timedelta(days=self.settings.refresh_token_expire_days)
        await self.db.sessions.insert_one(
            {"user_id": user_id, "refresh_token_hash": token_hash(refresh_token), "created_at": datetime.now(UTC), "expires_at": expires_at}
        )
        return refresh_token

    async def refresh(self, refresh_token: str) -> tuple[str, str]:
        session = await self.db.sessions.find_one({"refresh_token_hash": token_hash(refresh_token), "expires_at": {"$gt": datetime.now(UTC)}})
        if session is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        user = await self.db.users.find_one({"_id": object_id(session["user_id"]), "disabled": {"$ne": True}})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        await self.db.sessions.delete_one({"_id": session["_id"]})
        new_refresh = await self.create_session(str(user["_id"]))
        return create_access_token(str(user["_id"]), user["role"]), new_refresh

    async def logout(self, refresh_token: str) -> None:
        await self.db.sessions.delete_one({"refresh_token_hash": token_hash(refresh_token)})

    async def forgot_password(self, email: str) -> str:
        token = token_urlsafe(40)
        await self.db.users.update_one(
            {"email": email.lower()},
            {"$set": {"reset_token_hash": token_hash(token), "reset_expires_at": datetime.now(UTC) + timedelta(minutes=self.settings.password_reset_expire_minutes)}},
        )
        return token

    async def reset_password(self, token: str, new_password: str) -> None:
        user = await self.db.users.find_one({"reset_token_hash": token_hash(token), "reset_expires_at": {"$gt": datetime.now(UTC)}})
        if user is None:
            raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        await self.db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"password_hash": hash_password(new_password), "updated_at": datetime.now(UTC)}, "$unset": {"reset_token_hash": "", "reset_expires_at": ""}},
        )
        await self.db.sessions.delete_many({"user_id": str(user["_id"])})

    async def verify_email(self, token: str) -> None:
        user = await self.db.users.find_one({"verification_token_hash": token_hash(token), "verification_expires_at": {"$gt": datetime.now(UTC)}})
        if user is None:
            raise HTTPException(status_code=400, detail="Invalid or expired verification token")
        await self.db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"is_verified": True, "updated_at": datetime.now(UTC)}, "$unset": {"verification_token_hash": "", "verification_expires_at": ""}},
        )
