from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.settings import DATABASE_URL, API_DATABASE_URL

# Criar conexão com a base de dados central
engine = create_engine(DATABASE_URL)
api_engine = create_engine(API_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
ApiSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=api_engine)
Base = declarative_base()
ApiBase = declarative_base()


def init_db():
    """Cria as tabelas no banco de dados central"""
    Base.metadata.create_all(bind=engine)
    ApiBase.metadata.create_all(bind=api_engine)

def get_db():
    """Gerador de sessão para o banco de dados central"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_api_db():
    db = ApiSessionLocal()
    try:
        yield db
    finally:
        db.close()