from typing import Annotated

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.dependencies import get_current_user
from app.database.mongo import get_db
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenPair,
    UserRead,
    VerifyEmailRequest,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=dict, status_code=201)
async def register(payload: RegisterRequest, db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]) -> dict:
    user, verification_token = await AuthService(db).register(payload)
    return {"user": UserRead.model_validate(user).model_dump(by_alias=True), "email_verification_token": verification_token}


@router.post("/login", response_model=TokenPair)
async def login(payload: LoginRequest, db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]) -> TokenPair:
    _, access_token, refresh_token = await AuthService(db).authenticate(payload.email, payload.password)
    return TokenPair(access_token=access_token, refresh_token=refresh_token)


@router.post("/logout")
async def logout(payload: RefreshRequest, db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]) -> dict:
    await AuthService(db).logout(payload.refresh_token)
    return {"status": "logged_out"}


@router.post("/refresh", response_model=TokenPair)
async def refresh(payload: RefreshRequest, db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]) -> TokenPair:
    access_token, refresh_token = await AuthService(db).refresh(payload.refresh_token)
    return TokenPair(access_token=access_token, refresh_token=refresh_token)


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]) -> dict:
    reset_token = await AuthService(db).forgot_password(payload.email)
    return {"status": "reset_token_issued", "reset_token": reset_token}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]) -> dict:
    await AuthService(db).reset_password(payload.token, payload.new_password)
    return {"status": "password_reset"}


@router.post("/verify-email")
async def verify_email(payload: VerifyEmailRequest, db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]) -> dict:
    await AuthService(db).verify_email(payload.token)
    return {"status": "email_verified"}


@router.get("/me", response_model=UserRead)
async def me(user: Annotated[dict, Depends(get_current_user)]) -> dict:
    return user
