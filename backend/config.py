import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "civic_secret_key_2024")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "civic_jwt_secret_2024")

    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = int(os.getenv("DB_PORT", "3306"))
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "Aditya@07")
    DB_NAME = os.getenv("DB_NAME", "civic_issue_portal")

    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB

    # Cloudinary (set these env vars in production for persistent image storage)
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")
    USE_CLOUDINARY = bool(os.getenv("CLOUDINARY_CLOUD_NAME", ""))

    SLA_HOURS = {
        "garbage": 24,
        "streetlight": 48,
        "pothole": 72,
        "road_damage": 72,
        "water_leakage": 24,
        "drainage": 48,
        "other": 48,
    }

    PRIORITY_MAP = {
        "low": "low",
        "medium": "normal",
        "high": "high",
        "critical": "emergency",
    }
