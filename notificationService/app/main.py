from fastapi import FastAPI, APIRouter, HTTPException, Request, Query, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.config import SessionLocal, init_db
from app.models import Notification, ErrorResponse, SuccessResponse, NotificationListResponse, NotificationDB
from app.service import send_email, send_sms, send_push_notification

init_db()

app = FastAPI(
    title="Notification API",  
    description="API for sending email/sms/push notifications.",
    version="1.0.0",
    docs_url="/api/docs"
)

router = APIRouter(prefix="/v1/notifications", tags=["Email Notifications"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post(
    "/",
    status_code=201,
    response_model=SuccessResponse,  
    responses={
        201: {
            "description": "Notification sent successfully",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "message": "Notification sent successfully to user@example.com via email",
                        "notification_type": "payment_update"
                    }
                }
            }
        },
        400: {
            "description": "Bad Request - Invalid Input",
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
        422: {
            "description": "Unprocessable Entity - Missing Required Fields",
            "model": ErrorResponse,
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "message": "Missing required fields: recipient, delivery_method",
                            "type": "ValidationError",
                            "code": 422,
                            "trace_id": "ERR422-XYZ"
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
def create_notification(notification: Notification, db: Session = Depends(get_db)):
    """ Sends a notification (email, SMS, push) based on recipient's preferences. """
    new_notification = NotificationDB(
        recipient=notification.recipient,
        title=notification.title,
        body=notification.body,
        delivery_method=notification.delivery_method,
        notification_type=notification.notification_type
    )

    try:
        db.add(new_notification)
        db.commit()  
        db.refresh(new_notification)

        if notification.delivery_method == "email":
            send_email(notification.recipient, notification.title, notification.body)
        elif notification.delivery_method == "sms":
            send_sms(notification.recipient, notification.body)
        elif notification.delivery_method == "push":
            send_push_notification(notification.recipient, notification.body)
        else:
            db.rollback()  
            raise HTTPException(status_code=400, detail="Invalid delivery method")

    except Exception as e:
        db.rollback()  
        raise HTTPException(status_code=500, detail=f"Notification not sent: {str(e)}")

    return SuccessResponse(
        status="success", 
        message=f"Notification sent to {notification.recipient} via {notification.delivery_method}",
        notification_type=notification.notification_type
    )


@router.get(
    "/",
    response_model=NotificationListResponse,
    status_code=200,
    responses={
        200: {
            "description": "List of sent notifications with pagination",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "total": 2,
                        "notifications": [
                            {
                                "recipient": "user1@example.com",
                                "title": "🚛 Pickup Notification",
                                "body": "Your product **Tomatoes** (Quantity: 100) was picked up from **Warehouse A** on Tuesday (05/03/2025) at 15:00.",
                                "delivery_method": "email",
                                "notification_type": "collection_status"
                            },
                            {
                                "recipient": "user2@example.com",
                                "title": "💰 Payment Confirmation",
                                "body": "Dear Customer,\n\nYour payment of **$200** for the recent order has been successfully processed on **Wednesday (06/03/2025) at 09:30**.\n\nIf you have any questions, please contact our support team.\n\nBest regards,\nAgriRoute",
                                "delivery_method": "sms",
                                "notification_type": "payment_update"
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
            "model": ErrorResponse,
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "message": "No notifications have been sent yet.",
                            "type": "NotFoundError",
                            "code": 404,
                            "trace_id": "ERR404-XYZ"
                        }
                    }
                }
            }
        }
    }
)
def list_notifications(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    delivery_method: str = Query(None, description="Filter by delivery method"),
    db: Session = Depends(get_db)
):
    """ Returns paginated list of sent notifications """

    query = db.query(NotificationDB)

    if delivery_method:
        query = query.filter(NotificationDB.delivery_method == delivery_method)

    total = query.count()
    notifications = query.offset((page - 1) * size).limit(size).all()

    return {
        "total": total,
        "notifications": notifications,
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