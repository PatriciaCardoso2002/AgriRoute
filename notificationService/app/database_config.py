import psycopg2
from psycopg2 import sql
import secrets
from sqlalchemy.orm import Session
from app.models import ClientKey
from app.settings import POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT, API_DATABASE_URL, MASTER_DB
from app.database import ApiSessionLocal
from urllib.parse import urlparse

def criar_db_se_nao_existir(db_name):
    """🔹 Cria a base de dados API se ela não existir."""
    try:
        conn = psycopg2.connect(
            dbname="postgres",  
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            host=POSTGRES_HOST,
            port=POSTGRES_PORT
        )
        conn.autocommit = True
        cursor = conn.cursor()

        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
        exists = cursor.fetchone()

        if not exists:
            cursor.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(db_name)))
            print(f"✅ Banco de dados '{db_name}' criado com sucesso.")
        else:
            print(f"⚠️ Banco de dados '{db_name}' já existe.")

        cursor.close()
        conn.close()
    except psycopg2.Error as e:
        print(f"❌ Erro ao criar database {db_name}: {e}")

api_db_name = urlparse(API_DATABASE_URL).path[1:]  
criar_db_se_nao_existir(api_db_name)

def criar_base_dados_empresa(db_name):
    """🔹 Cria um novo banco de dados para uma empresa no PostgreSQL."""
    try:
        conn = psycopg2.connect(
            dbname=MASTER_DB,  
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            host=POSTGRES_HOST,
            port=POSTGRES_PORT
        )
        conn.autocommit = True
        cursor = conn.cursor()

        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
        exists = cursor.fetchone()

        if not exists:
            cursor.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(db_name)))
            print(f"✅ Banco da empresa '{db_name}' criado com sucesso.")
        else:
            print(f"⚠️ Banco da empresa '{db_name}' já existe.")

        cursor.close()
        conn.close()
    except psycopg2.Error as e:
        print(f"❌ Erro ao criar database {db_name}: {e}")

def gerar_api_key(email: str):
    """🔹 Gera uma API Key e salva na base de dados API."""
    try:
        db=ApiSessionLocal()
        key = secrets.token_hex(32)
        client_key = ClientKey(email=email, key=key)
        db.add(client_key)
        db.commit()
        db.refresh(client_key)
        return key
    except Exception as e:
        db.rollback()
        raise e
