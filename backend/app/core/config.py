from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://invoice_user:invoice_password@localhost:5432/invoice_ai"
    secret_key: str = "change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"
    chroma_host: str = "localhost"
    chroma_port: int = 8001
    upload_dir: str = "storage/uploads"
    report_dir: str = "storage/reports"
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://localhost:3002,http://127.0.0.1:3002"
    rate_limit_per_minute: int = 120

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
