import os, sys
from time import sleep
from dotenv import load_dotenv
import psycopg2

load_dotenv()

print("Variáveis lidas:")
print("DB:", os.getenv("POSTGRES_DB"))
print("USER:", os.getenv("POSTGRES_USER"))
print("PWD:", os.getenv("POSTGRES_PASSWORD"))
print("PORT:", os.getenv("POSTGRES_PORT"))

retries = 10
while retries > 0:
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("POSTGRES_DB"),
            user=os.getenv("POSTGRES_USER"),
            password=os.getenv("POSTGRES_PASSWORD"),
            host="127.0.0.1",
            port=os.getenv("POSTGRES_PORT", "5431")
        )
        conn.close()
        print("Banco de dados pronto!")
        sys.exit(0)
    except Exception as e:
        print(f"Tentativa {10 - retries + 1}/10:", e)
        retries -= 1
        sleep(5)

print("Banco de dados não respondeu a tempo.")
sys.exit(1)