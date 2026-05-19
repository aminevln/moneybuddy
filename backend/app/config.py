"""
Configurazione dell'applicazione.

Carica le variabili d'ambiente dal file .env e le rende
disponibili come oggetto tipato `settings`.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


class Settings(BaseSettings):
    """
    Tutte le configurazioni dell'app. Pydantic legge automaticamente
    le variabili d'ambiente con lo stesso nome (case-insensitive).
    
    Esempio: la variabile d'ambiente DATABASE_URL diventa settings.database_url
    """
    
    # ============================================================
    # APP
    # ============================================================
    app_name: str = "MoneyBuddy API"
    environment: str = "development"  # development | staging | production
    debug: bool = True
    
    # ============================================================
    # DATABASE
    # ============================================================
    database_url: str = (
        "postgresql+asyncpg://moneybuddy:moneybuddy_dev_password@localhost:5432/moneybuddy"
    )
    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        """
        Railway/Heroku/Render danno `postgresql://...` (driver sync).
        Convertiamo in `postgresql+asyncpg://...` per SQLAlchemy async.
        """
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v
    
    # ============================================================
    # CORS
    # ============================================================
    # Domini autorizzati a chiamare l'API.
    # `cors_origins` ha i default per dev locale (localhost).
    # `extra_cors_origins` permette di aggiungere origini extra via env var
    # senza toccare codice (es. per testare via IP da telefono o per il deploy).
    #
    # Formato env: EXTRA_CORS_ORIGINS=http://172.20.10.4:3000,https://myapp.vercel.app
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    extra_cors_origins: str = ""  # comma-separated, popolato da .env
    
    @property
    def all_cors_origins(self) -> list[str]:
        """
        Restituisce la lista completa di origini CORS:
        defaults + quelle extra parsate da `extra_cors_origins`.
        """
        extras = [
            origin.strip()
            for origin in self.extra_cors_origins.split(",")
            if origin.strip()
        ]
        return self.cors_origins + extras
    
    # ============================================================
    # AI / LLM
    # ============================================================
    google_api_key: str
    
    # Modelli Gemini in uso
    gemini_main_model: str = "gemini-2.5-flash"          # chat principale
    gemini_fast_model: str = "gemini-2.5-flash-lite"     # intent, classification, embedding tasks
    gemini_embedding_model: str = "gemini-embedding-001"
    
    # ============================================================
    # SECURITY / AUTH
    # ============================================================
    secret_key: str = "dev-secret-change-me-in-production-please"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30
    
    # ============================================================
    # CONFIGURAZIONE PYDANTIC
    # ============================================================
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """
    Factory che restituisce le settings.
    """
    return Settings()


settings = get_settings()