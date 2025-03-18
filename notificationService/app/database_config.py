import psycopg2
import secrets
from app.database import SessionLocal
from app.models import Company, ClientKey
from app.settings import POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, MASTER_DB
from app.database import SessionLocal, init_db

db = SessionLocal()

def gerar_api_key(email):
    key = secrets.token_hex(32)
    client_key = ClientKey(email=email, key=key)
    db.add(client_key)
    db.commit()  # Salvar no banco de dados
    return key

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