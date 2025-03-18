from pydantic import BaseModel, EmailStr
from typing import List
from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base, ApiBase
from sqlalchemy.orm import relationship
class NotificationDB(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient = Column(String, index=True, nullable=False)  # email, telefone ou user_id
    title = Column(String, nullable=False)
    body = Column(String, nullable=False)
    notification_type = Column(String, nullable=False)

class NotificationCreate(BaseModel):
    """Modelo Pydantic para criar notificações (entrada)"""
    recipient: str
    title: str
    body: str
    notification_type: str

class NotificationResponse(BaseModel):
    """Modelo Pydantic para resposta de uma notificação"""
    id: int
    recipient: str
    title: str
    body: str
    notification_type: str

    class Config:
        from_attributes = True 

class NotificationListResponse(BaseModel):
    """Modelo para resposta estruturada da listagem de notificações"""
    total: int
    notifications: List[NotificationResponse]
    page: int
    size: int
    class Config:
        json_schema_extra = {
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
        json_schema_extra = {
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

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    key = Column(String, unique=True, index=True)  
    db_name = Column(String, unique=True, index=True)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    senha_hash = Column(String)
    empresa_id = Column(Integer, ForeignKey("companies.id"))
    empresa = relationship("Company")

class RegisterRequest(BaseModel):
    nome: str
    email: EmailStr
    senha: str

class ClientKey(ApiBase):
    __tablename__ = "client_keys"
    
    id = Column(Integer, primary_key=True, autoincrement=True) 
    email = Column(String, unique=True, index=True)
    key = Column(String, unique=True, index=True)  

class APIKeyResponse(BaseModel):
    id: int
    email: str
    key: str

class PaginatedResponse(BaseModel):
    status: str
    total: int
    page: int
    size: int
    api_keys: List[APIKeyResponse]



