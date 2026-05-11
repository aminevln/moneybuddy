"""
Configurazione dell'applicazione.

Carica le variabili d'ambiente dal file .env e le rende
disponibili come oggetto tipato `settings`.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


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
    # Stringa di connessione a Postgres in formato async (asyncpg)
    # Formato: postgresql+asyncpg://user:password@host:port/dbname
    database_url: str = (
        "postgresql+asyncpg://moneybuddy:moneybuddy_dev_password@localhost:5432/moneybuddy"
    )
    # ============================================================
    # CORS
    # ============================================================
    # Domini autorizzati a chiamare l'API.
    # In dev: il frontend Next.js gira su localhost:3000
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    # ============================================================
    # CONFIGURAZIONE PYDANTIC
    # ============================================================
    model_config = SettingsConfigDict(
        env_file=".env",          # legge da .env nella cartella backend/
        env_file_encoding="utf-8",
        case_sensitive=False,     # DATABASE_URL = database_url
        extra="ignore",           # ignora variabili extra senza errori
    )


@lru_cache
def get_settings() -> Settings:
    """
    Factory che restituisce le settings.
    
    Usiamo @lru_cache così le settings vengono lette UNA volta sola
    e poi cachate in memoria. Importante perché Pydantic-settings
    legge il file .env ogni volta che istanzi Settings().
    """
    return Settings()


# Istanza globale, importabile come `from app.config import settings`
settings = get_settings()