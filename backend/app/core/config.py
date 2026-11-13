import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

# Ensure SQLAlchemy Cython extension is disabled to prevent WDAC / AppLocker DLL block
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

class Settings(BaseSettings):
    PROJECT_NAME: str = "AutoChef"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "autochef-super-secure-production-ready-jwt-secret-key-9921")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./autochef.db")

    # Storage Paths
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "backend", "uploads")
    TRAINED_MODELS_DIR: str = os.path.join(BASE_DIR, "backend", "trained_models")
    DATASETS_DIR: str = os.path.join(BASE_DIR, "backend", "datasets")

    # ML Configs
    YOLO_MODEL_PATH: str = os.path.join(TRAINED_MODELS_DIR, "yolov8n.pt")
    CONFIDENCE_THRESHOLD: float = 0.35
    MAX_IMAGE_SIZE_MB: int = 10
    ALLOWED_IMAGE_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".webp"]

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.TRAINED_MODELS_DIR, exist_ok=True)
os.makedirs(settings.DATASETS_DIR, exist_ok=True)
