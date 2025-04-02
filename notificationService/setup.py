import os
import sys
import subprocess
from dotenv import load_dotenv

VENV_DIR = ".venv"

def run_command(command, cwd=None, env=None):
    result = subprocess.run(command, cwd=cwd, shell=True, env=env,
                            capture_output=True, text=True)
    if result.returncode != 0:
        print(f"❌ Erro ao executar: {command}")
        print(result.stderr)
    return result

def criar_venv():
    if not os.path.exists(VENV_DIR):
        print("🔄 Criando ambiente virtual...")
        run_command(f"{sys.executable} -m venv {VENV_DIR}")
    else:
        print("✅ Ambiente virtual já existe.")

def get_pip_path():
    return os.path.join(VENV_DIR, "Scripts" if os.name == "nt" else "bin", "pip")

def get_python_path():
    return os.path.join(VENV_DIR, "Scripts" if os.name == "nt" else "bin", "python")

def install_dependencies():
    pip_path = get_pip_path()
    print("📦 Instalando dependências...")
    run_command(f'"{pip_path}" install -r requirements.txt')

def wait_for_db():
    print("⏳ Verificando conexão com o banco de dados...")

    python_path = get_python_path()
    env = os.environ.copy()
    env["PATH"] = f"{os.path.dirname(python_path)}{os.pathsep}{env.get('PATH', '')}"

    result = run_command(f'"{python_path}" check_db.py', env=env)
    return result.returncode == 0

def rodar_api():
    print("🚀 Iniciando FastAPI...")
    python_path = get_python_path()
    subprocess.Popen(
            f'"{python_path}" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload',
            shell=True
        )
if __name__ == "__main__":
    load_dotenv()

    criar_venv()
    install_dependencies()

    if not wait_for_db():
        print("❌ Banco de dados indisponível")
        sys.exit(1)

    print("✅ Banco de dados pronto. Pronto para iniciar API.")
    rodar_api()
