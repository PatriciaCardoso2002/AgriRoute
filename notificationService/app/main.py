from fastapi import APIRouter, FastAPI, HTTPException, Request, Query, Depends
from fastapi.responses import JSONResponse
from app.auth import auth_router
from app.notifications import notifications_router
from app.socket_service import router as websocket_router
from app.models import ClientKey, PaginatedResponse, ErrorResponse
from app.database import get_api_db, init_db
from sqlalchemy.orm import Session


def startup():
    print("🔄 Inicializando o banco de dados...")
    init_db()
    print("✅ Base de dados inicializado!")


app = FastAPI(
    title="Notification API",
    description="Service for sending email, SMS, and push notifications for multiple clients.",
    version="1.0.0",
    docs_url="/api/docs",
    on_startup=[startup]  # Garante que `init_db()` rode no início
)

api_r = APIRouter(prefix="/v1/notifications/api_keys", tags=["API Keys"])

@api_r.get("", response_model=PaginatedResponse, responses={404: {"model": ErrorResponse}})
def list_api_keys(
    page: int = Query(1, ge=1, description="Número da página (deve ser >= 1)"),
    size: int = Query(10, ge=1, le=100, description="Tamanho da página (entre 1 e 100)"),
    db: Session = Depends(get_api_db),  # ⚠️ Usando a DB correta!
):
    """Retorna uma lista paginada de chaves de API e emails associados."""

    total = db.query(ClientKey).count()

    if total == 0:
        raise HTTPException(
            status_code=404,
            detail={
                "message": "No API keys found.",
                "type": "NotFoundError",
                "code": 404,
                "trace_id": "ERR404-API-KEYS"
            }
        )

    if (page - 1) * size >= total:
        raise HTTPException(
            status_code=404,
            detail={
                "message": "Page number exceeds total available API keys.",
                "type": "PaginationError",
                "code": 400,
                "trace_id": "ERR404-PAGINATION"
            }
        )

    api_keys = db.query(ClientKey).offset((page - 1) * size).limit(size).all()

    return {
        "status": "success",
        "total": total,
        "page": page,
        "size": size,
        "api_keys": [{"id": key.id, "email": key.email, "key": key.key} for key in api_keys]
    }


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

app.include_router(api_r) # API Keys
app.include_router(auth_router)  # Autenticação
app.include_router(notifications_router)  # Notificações
app.include_router(websocket_router) #Socket
