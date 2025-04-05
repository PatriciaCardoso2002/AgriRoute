from fastapi import APIRouter, HTTPException, Header, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from app.settings import  SECRET_KEY, ALGORITHM
from app.database import get_db, get_api_db
from app.models import Company, User, RegisterRequest, ErrorResponse
from app.database_config import gerar_api_key

import logging


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

auth_router = APIRouter(prefix="/v1/notifications/auth", tags=["Authentication"])

# ------------------- AUTENTICAÇÃO DA EMPRESA (API KEY) ------------------- #

def autenticar_empresa(
    request: Request,
    api_key: str = Header(None), 
    db: Session = Depends(get_db)
):
    """Verifica a API Key e retorna a empresa correspondente"""
    
    logging.basicConfig(level=logging.INFO)

    if not api_key:
        logging.info("❌ Nenhuma API Key foi recebida!")
        raise HTTPException(status_code=401, detail="API Key necessária")  

    # Tenta ver empresa no banco de dados com essa API Key
    empresa = db.query(Company).filter(Company.key == api_key).first()
    
    if not empresa:
        logging.info(f"❌ API Key {api_key} não encontrada no banco de dados!")
        raise HTTPException(status_code=403, detail="API Key inválida")

    logging.info(f"✅ API Key válida! Empresa: {empresa.name}")
    return empresa

# ------------------- REGISTRO DE EMPRESA (CRIAR DB) ------------------- #

@auth_router.post(
    "/register",
    responses={
        201: {
            "description": "Company successfully registered",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Empresa registrada com sucesso.",
                        "api_key": "123456789abcdef"
                    }
                }
            }
        },
        400: {
            "description": "Bad Request - Company or Email Already Registered",
            "model": ErrorResponse,
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "message": "Company already registered.",
                            "type": "ValidationError",
                            "code": 400,
                            "trace_id": "ERR400-COMPANY-EXISTS"
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
                            "message": "Missing required fields: 'nome', 'email', or 'senha'.",
                            "type": "ValidationError",
                            "code": 422,
                            "trace_id": "ERR422-REGISTER"
                        }
                    }
                }
            }
        }
    }
)
async def register_company(request: RegisterRequest, db: Session = Depends(get_db)):
    """Registers a new company and ensures unique email"""
    if not request.nome or not request.email or not request.senha:
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "message": "Missing required fields: 'nome', 'email', or 'senha'.",
                    "type": "ValidationError",
                    "code": 422,
                    "trace_id": "ERR422-REGISTER"
                }
            }
        )

    existing_company = db.query(Company).filter(Company.name == request.nome).first()
    if existing_company:
        return JSONResponse(
            status_code=400,
            content={
                "error": {
                    "message": "Company already registered.",
                    "type": "ValidationError",
                    "code": 400,
                    "trace_id": "ERR400-COMPANY-EXISTS"
                }
            }
        )

    existing_email = db.query(User).filter(User.email == request.email).first()
    if existing_email:
        return JSONResponse(
            status_code=400,
            content={
                "error": {
                    "message": "Email already registered. Please use a different email.",
                    "type": "ValidationError",
                    "code": 400,
                    "trace_id": "ERR400-EMAIL-EXISTS"
                }
            }
        )

    try:
        api_key = gerar_api_key(request.email)

        db_name = f"company_{request.nome.lower()}"
        empresa = Company(name=request.nome, db_name=db_name, key=api_key)
        db.add(empresa)
        db.commit()
        db.refresh(empresa)

        senha_hash = pwd_context.hash(request.senha)
        user = User(nome="Admin", email=request.email, senha_hash=senha_hash, empresa_id=empresa.id)
        db.add(user)
        db.commit()

        return {
            "message": f"Empresa {request.nome} registrada com sucesso.",
            "api_key": api_key  
        }

    except Exception as e:
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "message": f"An unexpected error occurred while registering the company: {str(e)}",
                    "type": "ServerError",
                    "code": 500,
                    "trace_id": "ERR500-REGISTER"
                }
            }
        )


# ------------------- AUTENTICAÇÃO DO USUÁRIO (LOGIN COM JWT) ------------------- #

def criar_token_jwt(dados: dict, expira_em: int = 60):
    """Gera um token JWT para autenticação do usuário."""
    dados["exp"] = datetime.utcnow() + timedelta(minutes=expira_em)
    return jwt.encode(dados, SECRET_KEY, algorithm=ALGORITHM)

def verificar_senha(senha, senha_hash):
    """Verifica a senha com hash bcrypt."""
    return pwd_context.verify(senha, senha_hash)
