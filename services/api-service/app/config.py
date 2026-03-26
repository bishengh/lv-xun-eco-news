"""
绿讯 API Service — 配置
"""
import json
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://lvxun:lvxun_2026@localhost:5432/lvxun"
    DATABASE_URL_SYNC: str = "postgresql://lvxun:lvxun_2026@localhost:5432/lvxun"
    CORS_ORIGINS: str = '["http://localhost:5173","http://localhost:3000"]'

    @property
    def cors_origins_list(self) -> list[str]:
        return json.loads(self.CORS_ORIGINS)

    class Config:
        env_file = ".env"


settings = Settings()
