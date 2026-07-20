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
            # Keep connection open and wait for incoming messages (e.g. ping)
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, patient_id)
