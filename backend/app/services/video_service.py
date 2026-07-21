from datetime import UTC, datetime, timedelta
import logging

import httpx
from fastapi import HTTPException
from jose import jwt
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config.settings import Settings, get_settings
from app.utils.object_id import object_id

logger = logging.getLogger("mediai.video")


class VideoService:
    def __init__(self, db: AsyncIOMotorDatabase, settings: Settings | None = None):
        self.db = db
        self.settings = settings or get_settings()

    def _require_daily_config(self) -> None:
        if not self.settings.daily_api_key or not self.settings.daily_domain or not self.settings.daily_domain_id:
            raise HTTPException(status_code=503, detail="Video provider is not configured")

    def _parse_slot_window(self, date_value: str, slot: str) -> tuple[datetime, datetime]:
        start = datetime.strptime(f"{date_value} {slot}", "%Y-%m-%d %I:%M %p").replace(tzinfo=UTC)
        end = start + timedelta(minutes=self.settings.consultation_duration_minutes)
        return start, end

    async def _create_daily_room(self, room_name: str, starts_at: datetime, ends_at: datetime) -> dict:
        self._require_daily_config()
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.settings.daily_api_base_url}/rooms",
                json={
                    "name": room_name,
                    "privacy": "private",
                    "properties": {
                        "nbf": int((starts_at - timedelta(minutes=15)).timestamp()),
                        "exp": int((ends_at + timedelta(minutes=30)).timestamp()),
                        "enable_chat": True,
                        "enable_prejoin_ui": True,
                        "enable_screenshare": False,
                        "max_participants": 2,
                        "eject_at_room_exp": True,
                    },
                },
                headers={
                    "Authorization": f"Bearer {self.settings.daily_api_key}",
                    "Content-Type": "application/json",
                },
            )

        if response.status_code >= 400:
            logger.error("Daily room creation failed: %s", response.text)
            raise HTTPException(status_code=502, detail="Failed to provision video room")

        return response.json()

    def _create_daily_token(
        self,
        *,
        room_name: str,
        user_id: str,
        user_name: str,
        is_owner: bool,
        starts_at: datetime,
        ends_at: datetime,
    ) -> tuple[str, datetime]:
        self._require_daily_config()
        issued_at = int(datetime.now(UTC).timestamp())
        expires_at = ends_at + timedelta(minutes=30)
        payload = {
            "d": self.settings.daily_domain_id,
            "r": room_name,
            "iat": issued_at,
            "nbf": int((starts_at - timedelta(minutes=15)).timestamp()),
            "exp": int(expires_at.timestamp()),
            "u": user_name,
            "ud": user_id,
            "o": is_owner,
            "ctoe": True,
            "vo": False,
            "ao": False,
        }
        token = jwt.encode(payload, self.settings.daily_api_key, algorithm="HS256")
        return token, expires_at

    async def get_appointment_video_session(self, appointment_id: str, user: dict) -> dict:
        appointment = await self.db.appointments.find_one({"_id": object_id(appointment_id)})
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")

        user_id = str(user["_id"])
        if user_id not in {appointment.get("patient_id"), appointment.get("doctor_id")}:
            raise HTTPException(status_code=403, detail="Not authorized to join this consultation")

        if appointment.get("status") != "confirmed":
            raise HTTPException(status_code=400, detail="Appointment is not confirmed")

        starts_at, ends_at = self._parse_slot_window(appointment["date"], appointment["slot"])
        room_name = appointment.get("video_room_name") or f"doordoctor-{appointment_id}"
        room_url = appointment.get("video_room_url")

        if not room_url:
            room = await self._create_daily_room(room_name, starts_at, ends_at)
            room_name = room["name"]
            room_url = room["url"]
            await self.db.appointments.update_one(
                {"_id": appointment["_id"]},
                {
                    "$set": {
                        "video_provider": "daily",
                        "video_room_name": room_name,
                        "video_room_url": room_url,
                        "video_room_expires_at": ends_at + timedelta(minutes=30),
                        "updated_at": datetime.now(UTC),
                    }
                },
            )

        token, expires_at = self._create_daily_token(
            room_name=room_name,
            user_id=user_id,
            user_name=user.get("full_name") or "DoorDoctor User",
            is_owner=user.get("role") == "doctor",
            starts_at=starts_at,
            ends_at=ends_at,
        )

        return {
            "provider": "daily",
            "room_name": room_name,
            "room_url": room_url,
            "token": token,
            "expires_at": expires_at,
        }
