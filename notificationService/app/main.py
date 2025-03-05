from fastapi import FastAPI, APIRouter, HTTPException, Request, Query, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.config import SessionLocal, init_db
from app.models import Notification, ErrorResponse, SuccessResponse, NotificationListResponse, NotificationDB
from app.service import send_email, send_sms, send_push_notification
import re

init_db()

app = FastAPI(
    title="Notification API",  
    description="API for sending email/sms/push notifications.",
    version="1.0.0",
    docs_url="/api/docs"
)

router = APIRouter(prefix="/v2/notifications", tags=["Email Notifications"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post(
    "/sms/",
    status_code=201,
    response_model=SuccessResponse,
    responses={
        201: {
            "description": "Notification sent successfully",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "message": "Notification sent successfully",
                        "recipient": "+123456789",
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
                            "message": "Invalid phone number format. Must be in E.164 format (e.g., +1234567890).",
                            "type": "ValidationError",
                            "code": 400,
                            "trace_id": "ERR400-SMS-XYZ"
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
                            "message": "Missing required fields: 'recipient' (phone), 'title', or 'body'.",
                            "type": "ValidationError",
                            "code": 422,
                            "trace_id": "ERR422-SMS-XYZ"
                        }
                    }
                }
            }
        },
        500: {
            "description": "Internal Server Error - Failed to send notification",
            "model": ErrorResponse,
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "message": "An unexpected error occurred while sending the SMS notification.",
                            "type": "ServerError",
                            "code": 500,
                            "trace_id": "ERR500-SMS-XYZ"
                        }
                    }
                }
            }
        }
    }
)
def create_notification_sms(notification: Notification, db: Session = Depends(get_db)):
    """ Sends a notification through sms"""
    if not all([notification.recipient, notification.title, notification.body, notification.notification_type]):
        raise HTTPException(status_code=422, detail="Missing required fields: recipient, title, body, or notification_type")

    if not re.fullmatch(r"^\+?[1-9]\d{1,14}$", notification.recipient):
        raise HTTPException(status_code=400, detail="Invalid phone number format. Use E.164 format (e.g., +1234567890)")

    new_notification = NotificationDB(
        recipient=notification.recipient,
        title=notification.title,
        body=notification.body,
        notification_type=notification.notification_type
    )

    try:
        send_sms(notification.recipient, notification.body) 

        db.add(new_notification)
        db.commit()
        db.refresh(new_notification)

    except Exception as e:
        db.rollback()  
        raise HTTPException(status_code=500, detail=f"Notification not sent: {str(e)}")

    return SuccessResponse(
        status="success",
        message=f"Notification sent to {notification.recipient} via SMS",
        notification_type=notification.notification_type
    )


@router.post(
    "/email/",
    status_code=201,
    response_model=SuccessResponse,
    responses={
        201: {
            "description": "Notification sent successfully",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "message": "Notification sent successfully",
                        "recipient": "user@example.com",
                        "notification_type": "payment_update"
                    }
                }
            }
        },
        400: {
            "description": "Bad Request - Invalid Email Format",
            "model": ErrorResponse,
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "message": "Invalid email format. Expected format: 'example@domain.com'.",
                            "type": "ValidationError",
                            "code": 400,
                            "trace_id": "ERR400-EMAIL-XYZ"
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
                            "message": "Missing required fields: 'recipient' (email), 'title', or 'body'.",
                            "type": "ValidationError",
                            "code": 422,
                            "trace_id": "ERR422-EMAIL-XYZ"
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
                            "message": "SMTP Authentication Failed. Check credentials or SMTP settings.",
                            "type": "AuthenticationError",
                            "code": 401,
                            "trace_id": "ERR401-EMAIL-XYZ"
                        }
                    }
                }
            }
        },
        500: {
            "description": "Internal Server Error - Email Sending Failed",
            "model": ErrorResponse,
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "message": "An unexpected error occurred while sending the email notification.",
                            "type": "ServerError",
                            "code": 500,
                            "trace_id": "ERR500-EMAIL-XYZ"
                        }
                    }
                }
            }
        }
    }
)
def create_notification_email(notification: Notification, db: Session = Depends(get_db)):
    """ Sends a notification through email"""
    if not all([notification.recipient, notification.title, notification.body, notification.notification_type]):
        raise HTTPException(status_code=422, detail="Missing required fields: recipient, title, body, or notification_type")

    if not re.fullmatch(r"[^@]+@[^@]+\.[^@]+", notification.recipient):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    new_notification = NotificationDB(
        recipient=notification.recipient,
        title=notification.title,
        body=notification.body,
        notification_type=notification.notification_type
    )

    try:
        send_email(notification.recipient, notification.title, notification.body)

        db.add(new_notification)
        db.commit()  
        db.refresh(new_notification)
    
    except Exception as e:
        db.rollback()  
        raise HTTPException(status_code=500, detail=f"Notification not sent: {str(e)}")

    return SuccessResponse(
        status="success", 
        message=f"Notification sent to {notification.recipient} via email",
        notification_type=notification.notification_type
    )

@router.post(
    "/push",
    status_code=201,
    response_model=SuccessResponse,
    responses={
        201: {
            "description": "Push notification sent successfully",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "message": "Notification sent successfully",
                        "recipient": "user123",
                        "notification_type": "payment_update"
                    }
                }
            }
        },
        400: {
            "description": "Bad Request - Invalid User ID",
            "model": ErrorResponse,
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "message": "Invalid user ID. The recipient must be a valid registered user.",
                            "type": "ValidationError",
                            "code": 400,
                            "trace_id": "ERR400-PUSH-XYZ"
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
                            "message": "Missing required fields: 'recipient' (user ID), 'title', or 'body'.",
                            "type": "ValidationError",
                            "code": 422,
                            "trace_id": "ERR422-PUSH-XYZ"
                        }
                    }
                }
            }
        },
        500: {
            "description": "Internal Server Error - Push Notification Failure",
            "model": ErrorResponse,
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "message": "An unexpected error occurred while sending the push notification.",
                            "type": "ServerError",
                            "code": 500,
                            "trace_id": "ERR500-PUSH-XYZ"
                        }
                    }
                }
            }
        }
    }
)
def create_notification_push(notification: Notification, db: Session = Depends(get_db)):
    """ Sends a notification by push"""
    if not notification.recipient.strip():
        raise HTTPException(status_code=400, detail="Recipient user ID is required for push notifications.")
    
    new_notification = NotificationDB(
        recipient=notification.recipient,
        title=notification.title,
        body=notification.body,
        notification_type=notification.notification_type
    )

    try:
        send_push_notification(notification.recipient, notification.body)

        db.add(new_notification)
        db.commit()  
        db.refresh(new_notification)

    except Exception as e:
        db.rollback()  
        raise HTTPException(status_code=500, detail=f"Notification not sent: {str(e)}")

    return SuccessResponse(
        status="success", 
        message=f"Notification sent to {notification.recipient} via push",
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
                                "notification_type": "collection_status"
                            },
                            {
                                "recipient": "user2@example.com",
                                "title": "💰 Payment Confirmation",
                                "body": "Dear Customer,\n\nYour payment of **$200** for the recent order has been successfully processed on **Wednesday (06/03/2025) at 09:30**.\n\nIf you have any questions, please contact our support team.\n\nBest regards,\nAgriRoute",
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
    db: Session = Depends(get_db)
):
    """ Returns paginated list of sent notifications """

    query = db.query(NotificationDB)

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