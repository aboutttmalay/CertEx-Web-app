import os
from typing import List


def _split_csv(value: str) -> List[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


class Settings:
    APP_NAME = os.getenv("CERTEX_APP_NAME", "CertEx API")
    OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "http://localhost:11434/v1")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "ollama")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "mistral")
    MAX_UPLOAD_MB = int(os.getenv("CERTEX_MAX_UPLOAD_MB", "25"))
    CORS_ORIGINS = _split_csv(
        os.getenv("CERTEX_CORS_ORIGINS", "http://localhost:3000,http://localhost:3001")
    )


settings = Settings()