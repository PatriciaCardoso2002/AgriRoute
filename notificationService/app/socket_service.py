from fastapi import APIRouter, WebSocket, WebSocketDisconnect, WebSocketException
from fastapi.responses import JSONResponse
from typing import Dict
import asyncio
import logging


router = APIRouter(prefix="/v1/notifications", tags=["Socket Notifications"])

active_connections: Dict[str, WebSocket] = {}

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """Gerencia conexões WebSocket associadas a um usuário específico"""
    try:
        await websocket.accept()
        logging.info(f"✅ Usuário {user_id} conectado ao WebSocket.")

        if user_id in active_connections:
            logging.warning(f"⚠ Conexão anterior de {user_id} será substituída.")

        active_connections[user_id] = websocket 
        logging.info(f"📌 Conexões ativas agora: {list(active_connections.keys())}")

        while True:
            try:
                data = await websocket.receive_text()
                logging.info(f"📩 Mensagem recebida de {user_id}: {data}")

            except asyncio.TimeoutError:
                logging.warning(f"⏳ Timeout na conexão de {user_id}. Mantendo ativa.")
                await websocket.send_text("⚠ Warning: Connection timeout detected.")

            except WebSocketDisconnect:
                logging.info(f"❌ {user_id} desconectado.")
                break

            except Exception as e:
                logging.error(f"🚨 Erro inesperado com {user_id}: {e}")
                await websocket.close(code=1011, reason="Internal Server Error")
                break

    except WebSocketException as e:
        logging.error(f"🚨 Erro WebSocket com {user_id}: {e}")
        await websocket.close(code=1002, reason="Protocol Error")

    except Exception as e:
        logging.error(f"🔥 Erro fatal no WebSocket de {user_id}: {e}")
        await websocket.close(code=1011, reason="Unexpected Error")

    finally:
        if user_id in active_connections:
            del active_connections[user_id]
            logging.info(f"📌 Conexões ativas após desconexão: {list(active_connections.keys())}")

@router.get(
    "/ws/docs",
    summary="WebSocket Documentation",
    description="Instructions for using the WebSocket connection.",
    responses={
        200: {
            "description": "Returns WebSocket connection details.",
            "content": {
                "application/json": {
                    "example": {
                        "message": "To connect to the WebSocket, use: ws://0.0.0.0:8080/ws/{user_id}",
                        "example": "ws://0.0.0.0:8080/ws/user123",
                        "client_example": "new WebSocket('ws://0.0.0.0:8080/ws/user123')"
                    }
                }
            }
        }
    }
)
async def websocket_info():
    """Returns WebSocket connection instructions."""
    return JSONResponse(
        status_code=200,
        content={
            "message": "To connect to the WebSocket, use: ws://0.0.0.0:8080/ws/{user_id}",
            "example": "ws://0.0.0.0:8080/ws/user123",
            "client_example": "new WebSocket('ws://0.0.0.0:8080/ws/user123')"
        }
    )