from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from app.database import init_db
from app.auth import auth_router
from app.notifications import notifications_router
from app.socket_service import router as websocket_router

def startup():
    print("🔄 Inicializando o banco de dados...")
    init_db()
    print("✅ Banco de dados inicializado!")

app = FastAPI(
    title="Notification API",
    description="Service for sending email, SMS, and push notifications for multiple clients.",
    version="1.0.0",
    docs_url="/api/docs",
    on_startup=[startup]  # Garante que `init_db()` rode no início
)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "message": exc.detail,
                "type": exc.__class__.__name__,
                "code": exc.status_code,
                "trace_id": f"ERR{exc.status_code}-XYZ"
            }
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "message": "An unexpected error occurred.",
                "type": "ServerError",
                "code": 500,
                "trace_id": "ERR500-XYZ"
            }
        }
    )

app.include_router(auth_router)  # Autenticação
app.include_router(notifications_router)  # Notificações
app.include_router(websocket_router) #Socket

