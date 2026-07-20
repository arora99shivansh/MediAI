from fastapi import APIRouter

from app.api.v1 import admin, auth, chat, documents, health, patient, doctor, webhooks, websocket

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(chat.router)
api_router.include_router(documents.router)
api_router.include_router(admin.router)
api_router.include_router(health.router)
api_router.include_router(patient.router)
api_router.include_router(doctor.router, prefix="/doctor")
api_router.include_router(webhooks.router)
api_router.include_router(websocket.router)
