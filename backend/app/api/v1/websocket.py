import json
import logging
from typing import Dict, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

logger = logging.getLogger("mediai.websocket")
router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, patient_id: str):
        await websocket.accept()
        if patient_id not in self.active_connections:
            self.active_connections[patient_id] = []
        self.active_connections[patient_id].append(websocket)
        logger.info(f"Client connected for patient {patient_id}")

    def disconnect(self, websocket: WebSocket, patient_id: str):
        if patient_id in self.active_connections:
            if websocket in self.active_connections[patient_id]:
                self.active_connections[patient_id].remove(websocket)
            if not self.active_connections[patient_id]:
                del self.active_connections[patient_id]
        logger.info(f"Client disconnected for patient {patient_id}")

    async def broadcast_vital(self, patient_id: str, payload: dict):
        if patient_id in self.active_connections:
            # Format payload for JSON serialization, handle ObjectId and datetime
            safe_payload = {}
            for k, v in payload.items():
                if k == "_id":
                    safe_payload[k] = str(v)
                elif hasattr(v, "isoformat"):
                    safe_payload[k] = v.isoformat()
                else:
                    safe_payload[k] = v
            
            message = json.dumps({"type": "VITAL_UPDATE", "data": safe_payload})
            for connection in self.active_connections[patient_id]:
                if connection.client_state == WebSocketState.CONNECTED:
                    try:
                        await connection.send_text(message)
                    except Exception as e:
                        logger.error(f"Error broadcasting vital: {e}")

manager = ConnectionManager()

@router.websocket("/ws/vitals/{patient_id}")
async def websocket_vitals(websocket: WebSocket, patient_id: str):
    await manager.connect(websocket, patient_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, patient_id)


class ChatConnectionManager:
    def __init__(self):
        # Maps user_id -> list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"Chat client connected: {user_id}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"Chat client disconnected: {user_id}")

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending chat ws message: {e}")

chat_manager = ChatConnectionManager()

@router.websocket("/ws/chat/{user_id}")
async def websocket_chat(websocket: WebSocket, user_id: str):
    await chat_manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            # Expecting data = {"receiver_id": "...", "content": "..."}
            # We will use this to broadcast live
            receiver_id = data.get("receiver_id")
            if receiver_id:
                # Send to receiver if online
                await chat_manager.send_personal_message(data, receiver_id)
                # Echo back to sender for confirmation
                await chat_manager.send_personal_message(data, user_id)
    except WebSocketDisconnect:
        chat_manager.disconnect(websocket, user_id)
