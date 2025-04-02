import os
import subprocess
import sys

VENV_DIR = "venv"

def criar_venv():
    """Cria um ambiente virtual, se não existir"""
    if not os.path.exists(VENV_DIR):
        print("🔄 Criando ambiente virtual...")
        subprocess.run([sys.executable, "-m", "venv", VENV_DIR], check=True)
    else:
        print("✅ Ambiente virtual já existe.")

def instalar_dependencias():
    """Instala pacotes do requirements.txt dentro do venv"""
    pip_exec = os.path.join(VENV_DIR, "bin", "pip") if os.name != "nt" else os.path.join(VENV_DIR, "Scripts", "pip")
    print("📦 Instalando dependências...")
    subprocess.run([pip_exec, "install", "-r", "../requirements.txt"], check=True)

def rodar_api():
    """Executa o FastAPI no ambiente virtual"""
    python_exec = os.path.join(VENV_DIR, "bin", "python") if os.name != "nt" else os.path.join(VENV_DIR, "Scripts", "python")
    print("🚀 Iniciando FastAPI...")
    subprocess.run([python_exec, "-m", "uvicorn", "main:app", "--reload"], check=True)

if __name__ == "__main__":
    criar_venv()
    instalar_dependencias()
    rodar_api()
