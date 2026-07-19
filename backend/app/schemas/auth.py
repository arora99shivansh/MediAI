import re
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class Role(StrEnum):
    doctor = "doctor"
    patient = "patient"
    admin = "admin"


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)
    full_name: str = Field(min_length=2, max_length=120)
    role: Role = Role.patient

    @field_validator("password")
    @classmethod
    def _check_strength(cls, v: str) -> str:
        missing = []
        if not re.search(r"[A-Z]", v):
            missing.append("an uppercase letter")
        if not re.search(r"[0-9]", v):
            missing.append("a digit")
        if not re.search(r"[^A-Za-z0-9]", v):
            missing.append("a special character")
        if missing:
            raise ValueError(f"Password must contain {', '.join(missing)}")
        return v

    @field_validator("full_name")
    @classmethod
    def _strip_name(cls, v: str) -> str:
        return v.strip()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=10, max_length=128)


class VerifyEmailRequest(BaseModel):
    token: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserRead(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="_id")
    email: EmailStr
    full_name: str
    role: Role
    is_verified: bool
    created_at: datetime
