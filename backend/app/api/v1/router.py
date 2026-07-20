from fastapi import APIRouter

from app.api.v1 import auth, chat, documents, patient, doctor, admin, health, webhooks, websocket, appointments, payments, messages

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
api_router.include_router(appointments.router, prefix="/appointments")
api_router.include_router(payments.router, prefix="/payments")
api_router.include_router(messages.router, prefix="/messages")
