import os
from dotenv import load_dotenv

load_dotenv()

# Port standar Ollama adalah 11434, bukan 8000
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

# Gunakan nama model yang benar, bukan ID
MODEL_NAME = os.getenv("MODEL_NAME", "mistral:latest")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./chatbot.db")

DEBUG = os.getenv("DEBUG", "True").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

MODEL_CONFIG = {
    "model": MODEL_NAME,  # Gunakan variabel yang sama
    "temperature": float(os.getenv("TEMPERATURE", 0.7)),
    "max_tokens": int(os.getenv("MAX_TOKENS", 500)),
    "top_p": float(os.getenv("TOP_P", 0.9))
}

SECRET_KEY = os.getenv("SECRET_KEY", "secret")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))