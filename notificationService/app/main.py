from fastapi import FastAPI, APIRouter, HTTPException, Request, Query
from fastapi.responses import JSONResponse
from app.models import Notification, ErrorResponse, SuccessResponse, NotificationListResponse
from app.email_service import send_email

app = FastAPI(
    title="Notification Email API",  
    description="API for sending email notifications.",
    version="1.0.0",
    docs_url="/api/docs",      
)

router = APIRouter(prefix="/v1/notifications", tags=["Email Notifications"])

notifications_db = []

@router.post(
    "/",
    status_code=201,
    response_model=SuccessResponse,  
    responses={
        201: {
            "description": "Email sent successfully",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "message": "Email sent successfully to user@example.com"
                    }
                }
            }
        },
        400: {
            "description": "Bad Request",
            "model": ErrorResponse,
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "message": "Invalid email format",
                            "type": "ValidationError",
                            "code": 400,
                            "trace_id": "ERR400-XYZ"
                        }
                    }
                }
            }
        },
        401: {
            "description": "Unauthorized - SMTP Authentication Failed",
            "model": ErrorResponse,
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "message": "SMTP Authentication Failed",
                            "type": "AuthenticationError",
                            "code": 401,
                            "trace_id": "ERR401-XYZ"
                        }
                    }
                }
            }
        },
        500: {
            "description": "Internal Server Error",
            "model": ErrorResponse,
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "message": "Unexpected error occurred",
                            "type": "ServerError",
                            "code": 500,
                            "trace_id": "ERR500-XYZ"
                        }
                    }
                }
            }
        }
    }
)
def create_notification(notification: Notification):
    """ Sends an email notification """
    send_email(notification)
    action = "Pickup" if notification.is_pickup else "Delivery"
    status_message = (
        f"{notification.quantity} units of {notification.product_name} "
        f"{'left' if notification.is_pickup else 'arrived at'} {notification.warehouse} "
        f"on {notification.event_date.strftime('%A (%d/%m/%Y) at %H:%M')}."
    )
    notifications_db.append({
        "email": notification.email,
        "product_name": notification.product_name,
        "quantity": notification.quantity,
        "event_date": notification.event_date,
        "warehouse": notification.warehouse,
        "is_pickup": notification.is_pickup,
        "subject": f"{notification.product_name} {action}",
        "message": status_message
    })
    return SuccessResponse(status="success", message=f"{action} email sent to {notification.email}")

@router.get(
    "/",
    response_model=NotificationListResponse,
    status_code=200,
    responses={
        200: {
            "description": "List of sent email notifications with pagination",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "total": 2,
                        "notifications": [
                            {
                                "email": "user1@example.com",
                                "subject": "🚛 Pickup Notification: Tomatoes",
                                "message": "Your product **Tomatoes** (Quantity: 100) was picked up from **Warehouse A** on Tuesday (05/03/2025) at 15:00."
                            },
                            {
                                "email": "user2@example.com",
                                "subject": "📦 Delivery Notification: Potatoes",
                                "message": "Your product **Potatoes** (Quantity: 200) was delivered to **Warehouse B** on Wednesday (06/03/2025) at 09:30."
                            }
                        ],
                        "page": 1,
                        "size": 10
                    }
                }
            }
        },
        404: {
            "description": "No notifications found",
            "model": ErrorResponse
        }
    }
)
def list_notifications(
    page: int = Query(1, ge=1, description="Page number (1-based index)"),
    size: int = Query(10, ge=1, le=100, description="Number of notifications per page (max: 100)")
):
    """Returns paginated list of sent notifications"""

    if not notifications_db:
        raise HTTPException(
            status_code=404,
            detail="No notifications have been sent yet."
        )

    start_index = (page - 1) * size
    end_index = start_index + size
    paginated_notifications = notifications_db[start_index:end_index]

    return {
        "status": "success",
        "total": len(notifications_db),
        "notifications": paginated_notifications,
        "page": page,
        "size": size
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


app.include_router(router)