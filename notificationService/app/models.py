from pydantic import BaseModel, EmailStr
from typing import List
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.config import Base 

class NotificationDB(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    product_name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    event_date = Column(DateTime, nullable=False)
    warehouse = Column(String, nullable=False)
    is_pickup = Column(Boolean, nullable=False)
    subject = Column(String, nullable=False)
    message = Column(String, nullable=False)

class Notification(BaseModel):
    """Model for notifying about product movements (pickup or delivery)"""
    email: EmailStr
    product_name: str
    quantity: int
    event_date: datetime
    warehouse: str
    is_pickup: bool  # True = Pickup, False = Delivery

    class Config:
        schema_extra = {
            "example": {
                "email": "user1@example.com",
                "subject": "🚛 Pickup Notification: Product 1",
                "message": (
                    "Dear Supplier,\n\n"
                    "Your product **Tomatoes** (Quantity: 100) "
                    "is scheduled for pickup from **Warehouse A** on Tuesday (05/03/2025) at 15:00.\n\n"
                    "If there are any changes, please contact us.\n\n"
                    "Best regards,\nAgriRoute"
                )
            }
        }


class NotificationListResponse(BaseModel):
    """Modelo para resposta estruturada da listagem de notificações"""
    status: str
    total: int
    notifications: List[Notification]

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

    class Config:
        schema_extra = {
            "example": {
                "status": "success",
                "message": "Email sent successfully to user@example.com"
            }
        }

class ErrorDetail(BaseModel):
    message: str
    type: str
    code: int
    trace_id: str = "TRACE12345"  

class ErrorResponse(BaseModel):
    error: ErrorDetail

