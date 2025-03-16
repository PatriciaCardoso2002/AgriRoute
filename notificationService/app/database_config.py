import psycopg2
import secrets
from app.database import SessionLocal
from app.models import Company
from app.settings import POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, MASTER_DB

def gerar_api_key():
    return secrets.token_hex(32)

def criar_base_dados_empresa(db_name):
    """Cria uma nova base de dados para uma empresa no PostgreSQL."""
    conn = psycopg2.connect(
        dbname=MASTER_DB, user=POSTGRES_USER, password=POSTGRES_PASSWORD, host=POSTGRES_HOST
    )
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute(f"CREATE DATABASE {db_name};")  # Criar DB
    cursor.close()
    conn.close()

def registrar_empresa(nome):
    """Registra uma nova empresa e cria sua base de dados exclusiva."""
    db = SessionLocal()
    db_name = f"company_{nome.lower()}"  
    api_key = gerar_api_key()

    # Criar nova base de dados para a empresa
    criar_base_dados_empresa(db_name)

    # Salvar no banco central
    empresa = Company(nome=nome, api_key=api_key, db_name=db_name)
    db.add(empresa)
    db.commit()
    db.refresh(empresa)
    db.close()
    return empresa
