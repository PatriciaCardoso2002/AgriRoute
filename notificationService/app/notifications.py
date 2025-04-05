from fastapi import APIRouter, Query, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import SessionLocal, get_db, get_api_db
from app.models import ErrorResponse, SuccessResponse, NotificationListResponse, NotificationDB, NotificationCreate, Company
from app.service import send_email, send_sms, send_push_notification
from app.auth import autenticar_empresa
from app.socket_service import active_connections
import re

notifications_router = APIRouter(prefix="/v1/notifications", tags=["Notifications"])

@notifications_router.post(
    "/sms",
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
            "description": "Bad Request - Invalid Phone Number Format",
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
            "description": "Internal Server Error - SMS Sending Failed",
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
async def create_notification_sms(
    notification: NotificationCreate,
    empresa: Company = Depends(autenticar_empresa), 
    db: Session = Depends(get_db)
):
    """ Sends a notification through SMS """

    if not notification.recipient or not notification.title or not notification.body or not notification.notification_type:
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "message": "Missing required fields: 'recipient' (phone), 'title', or 'body'.",
                    "type": "ValidationError",
                    "code": 422,
                    "trace_id": "ERR422-SMS-XYZ"
                }
            }
        )

    if not re.fullmatch(r"^\+?[1-9]\d{1,14}$", notification.recipient):
        return JSONResponse(
            status_code=400,
            content={
                "error": {
                    "message": "Invalid phone number format. Must be in E.164 format (e.g., +1234567890).",
                    "type": "ValidationError",
                    "code": 400,
                    "trace_id": "ERR400-SMS-XYZ"
                }
            }
        )

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
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "message": f"An unexpected error occurred while sending the SMS notification: {str(e)}",
                    "type": "ServerError",
                    "code": 500,
                    "trace_id": "ERR500-SMS-XYZ"
                }
            }
        )

    return SuccessResponse(
        status="success",
        message=f"Notification sent to {notification.recipient} via SMS",
        notification_type=notification.notification_type
    )


@notifications_router.post(
    "/email",
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
async def create_notification_email(
    notification: NotificationCreate,
    empresa: Company = Depends(autenticar_empresa), 
    db: Session = Depends(get_db)
):
    """Sends a notification through email"""

    if not notification.recipient or not notification.title or not notification.body or not notification.notification_type:
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "message": "Missing required fields: 'recipient' (email), 'title', or 'body'.",
                    "type": "ValidationError",
                    "code": 422,
                    "trace_id": "ERR422-EMAIL-XYZ"
                }
            }
        )

    email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    if not re.fullmatch(email_regex, notification.recipient):
        return JSONResponse(
            status_code=400,
            content={
                "error": {
                    "message": "Invalid email format. Expected format: 'example@domain.com'.",
                    "type": "ValidationError",
                    "code": 400,
                    "trace_id": "ERR400-EMAIL-XYZ"
                }
            }
        )

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

    except ValueError as ve:
        db.rollback()
        return JSONResponse(
            status_code=401,
            content={
                "error": {
                    "message": "SMTP Authentication Failed. Check credentials or SMTP settings.",
                    "type": "AuthenticationError",
                    "code": 401,
                    "trace_id": "ERR401-EMAIL-XYZ"
                }
            }
        )

    except Exception as e:
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "message": f"An unexpected error occurred while sending the email notification: {str(e)}",
                    "type": "ServerError",
                    "code": 500,
                    "trace_id": "ERR500-EMAIL-XYZ"
                }
            }
        )

    return SuccessResponse(
        status="success",
        message=f"Notification sent to {notification.recipient} via email",
        notification_type=notification.notification_type,
        empresa=empresa.name  
    )

@notifications_router.post(
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
            "description": "Bad Request - Invalid User ID or Disconnected WebSocket",
            "model": ErrorResponse,
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "message": "The user 'user1234' is not connected via WebSocket.",
                            "type": "WebSocketConnectionError",
                            "code": 400,
                            "trace_id": "ERR400-PUSH-NOCONNECTION"
                        }
                    }
                }
            }
        },
        422: {
            "description": "Missing required fields",
            "model": ErrorResponse
        },
        500: {
            "description": "Internal Server Error",
            "model": ErrorResponse
        }
    }
)
async def create_notification_push(
    notification: NotificationCreate,
    empresa: Company = Depends(autenticar_empresa), 
    db: Session = Depends(get_db)
):
    """ Envia uma notificação para um usuário específico via WebSocket """

    if not notification.recipient or not isinstance(notification.recipient, str) or not notification.recipient.strip():
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "message": "Missing required fields: 'recipient' (user ID), 'title', or 'body'.",
                    "type": "ValidationError",
                    "code": 422,
                    "trace_id": "ERR422-PUSH-XYZ"
                }
            }
        )

    print(f"📤 Tentando enviar notificação para {notification.recipient}...")

    try:
        # Verifica se o usuário está conectado via WebSocket
        if notification.recipient not in active_connections:
            print(f"⚠ ERRO: Usuário {notification.recipient} não está conectado ao WebSocket!")
            return JSONResponse(
                status_code=400,
                content={
                    "error": {
                        "message": f"The user '{notification.recipient}' is not connected via WebSocket.",
                        "type": "WebSocketConnectionError",
                        "code": 400,
                        "trace_id": "ERR400-PUSH-NOCONNECTION"
                    }
                }
            )

        await send_push_notification(
            notification.recipient,
            notification.notification_type,
            notification.body
        )
        print(f"✅ Notificação enviada com sucesso para {notification.recipient}")

    except Exception as e:
        print(f"❌ Erro ao enviar notificação: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "message": "An unexpected error occurred while sending the push notification.",
                    "type": "ServerError",
                    "code": 500,
                    "trace_id": "ERR500-PUSH-XYZ"
                }
            }
        )

    return SuccessResponse(
        status="success", 
        message=f"Notification sent to {notification.recipient} via WebSocket"
    )


@notifications_router.get(
    "",
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
async def list_notifications(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """ Returns paginated list of sent notifications """

    total = db.query(NotificationDB).count()

    if total == 0:
        return JSONResponse(
            status_code=404,
            content={
                "error": {
                    "message": "No notifications have been sent yet.",
                    "type": "NotFoundError",
                    "code": 404,
                    "trace_id": "ERR404-XYZ"
                }
            }
        )

    # ensure pagination does not exceed available notifications
    if (page - 1) * size >= total:
        return JSONResponse(
            status_code=404,
            content={
                "error": {
                    "message": "Page number exceeds total available notifications.",
                    "type": "NotFoundError",
                    "code": 404,
                    "trace_id": "ERR404-PAGINATION"
                }
            }
        )

    notifications = db.query(NotificationDB).offset((page - 1) * size).limit(size).all()

    return {
        "status": "success",
        "total": total,
        "notifications": notifications,
        "page": page,
        "size": size
    }
