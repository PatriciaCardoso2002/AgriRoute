from pydantic import BaseModel, root_validator
from typing import List
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from typing import Literal
from app.config import Base 
import re

class NotificationDB(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient = Column(String, index=True, nullable=False)  # email, telefone ou user_id
    title = Column(String, nullable=False)
    body = Column(String, nullable=False)
    delivery_method = Column(String, nullable=False)
    notification_type = Column(String, nullable=False)
class Notification(BaseModel):
    """Model for sending notifications (email, SMS, push)"""
    recipient: str
    title: str
    body: str
    delivery_method: str  # "email", "sms", "push"
    notification_type: str  # "collection_status", "payment_update"

    @root_validator(pre=True)
    def validate_recipient(cls, values):
        """
        Validate recipient based on delivery method:
        - If email, ensure recipient is a valid email.
        - If SMS, ensure recipient is a valid phone number.
        - If push notification, ensure recipient is a valid user identifier.
        """
        recipient = values.get("recipient")
        delivery_method = values.get("delivery_method")

        if not delivery_method:
            raise ValueError("Delivery method is required")

        if delivery_method == "email":
            if not re.fullmatch(r"[^@]+@[^@]+\.[^@]+", recipient):
                raise ValueError("Invalid email format for email delivery method")

        elif delivery_method == "sms":
            if not re.fullmatch(r"^\+?[1-9]\d{1,14}$", recipient):
                raise ValueError("Invalid phone number format for SMS delivery method. Use E.164 format (e.g., +1234567890)")

        elif delivery_method == "push":
            if not recipient.strip():
                raise ValueError("Recipient cannot be empty for push notifications")

        else:
            raise ValueError("Invalid delivery method. Choose 'email', 'sms', or 'push'.")

        return values  

    class Config:
        schema_extra = {
            "example": {
                "recipient": "user@example.com",
                "title": "🚛 Pickup Notification",
                "body": "Your product **Tomatoes** (Quantity: 100) was picked up from Warehouse A.",
                "delivery_method": "email",
                "notification_type": "collection_status"
            }
        }

class NotificationListResponse(BaseModel):
    """Modelo para resposta estruturada da listagem de notificações"""
    total: int
    notifications: List[Notification]
    page: int
    size: int
    class Config:
        schema_extra = {
            "example": {
                "status": "success",
                "total": 2,
                "notifications": [
                    {
                        "email": "user1@example.com",
                        "subject": "🚛 Pickup Notification: Tomatoes",
                        "message": (
                            "Dear Supplier,\n\n"
                            "Your product **Tomatoes** (Quantity: 100) "
                            "is scheduled for pickup from **Warehouse A** on Tuesday (05/03/2025) at 15:00.\n\n"
                            "If there are any changes, please contact us.\n\n"
                            "Best regards,\nAgriRoute"
                        )
                    },
                    {
                        "email": "user2@example.com",
                        "subject": "📦 Delivery Notification: Blueberries",
                        "message": (
                            "Dear Producer,\n\n"
                            "Your product **Blueberries** (Quantity: 6kg) "
                            "was delivered to **Loja da Dona Paula** on Saturday (02/03/2025) at 14:30.\n\n"
                            "If you have any questions, please contact us.\n\n"
                            "Best regards,\nAgriRoute"
                        )
                    }
                ]
            }
        }

class SuccessResponse(BaseModel):
    status: str
    message: str
    notification_type: str  

    class Config:
        schema_extra = {
            "example": {
                "status": "success",
                "message": "Email sent successfully to user@example.com",
                "notification_type": "payment_update"
            }
        }

class ErrorDetail(BaseModel):
    message: str
    type: str
    code: int
    trace_id: str = "TRACE12345"  

class ErrorResponse(BaseModel):
    error: ErrorDetail

