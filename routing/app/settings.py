import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("API_KEY")
BASE_URL = os.getenv("BASE_URL")
TOLERANCIA_METROS = int(os.getenv("TOLERANCIA_METROS", "50"))
