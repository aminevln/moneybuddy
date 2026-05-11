"""
Gestione della connessione al database.

Definisce:
- L'engine async (il "motore" che parla con Postgres)
- La session factory (fabbrica di sessioni di lavoro)
- La dependency `get_db` per FastAPI
- Le funzioni di lifecycle (apri/chiudi pool all'avvio/shutdown)
"""

from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings


# ============================================================
# ENGINE
# ============================================================
# L'engine è il "motore" di SQLAlchemy: gestisce il pool di
# connessioni a Postgres. Lo creiamo una sola volta all'avvio
# dell'applicazione.
#
# echo=True stamperebbe tutte le query SQL nei log (utile per
# debug, rumoroso in produzione). Lo leghiamo al flag debug.
# ============================================================
engine: AsyncEngine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,   # verifica la connessione prima di usarla (evita errori se Postgres si è riavviato)
    pool_size=5,          # connessioni mantenute aperte nel pool
    max_overflow=10,      # connessioni temporanee extra in caso di picco
)


# ============================================================
# SESSION FACTORY
# ============================================================
# Una "session" è un'unità di lavoro col database: la apri,
# fai le tue query/insert/update, la chiudi (o fai rollback).
# `async_sessionmaker` è una FABBRICA: ogni volta che la chiami
# ti dà una nuova sessione.
#
# expire_on_commit=False: dopo un commit gli oggetti restano
# usabili (default True ti costringe a ri-fetchare tutto).
# ============================================================
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


# ============================================================
# DEPENDENCY PER FASTAPI
# ============================================================
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency injection: fornisce una sessione DB agli endpoint.
    
    Uso negli endpoint:
        from fastapi import Depends
        from app.db.session import get_db
        
        @app.get("/users")
        async def list_users(db: AsyncSession = Depends(get_db)):
            result = await db.execute(...)
            ...
    
    FastAPI:
    1. Chiama get_db() quando l'endpoint viene invocato
    2. Riceve la sessione via `yield`
    3. La passa all'endpoint
    4. Quando l'endpoint finisce, riprende il controllo dopo yield
    5. Chiude la sessione (anche in caso di errori, grazie al context manager)
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ============================================================
# LIFECYCLE
# ============================================================
async def close_db_connections() -> None:
    """
    Chiude il pool di connessioni allo shutdown dell'app.
    
    Chiamato dal lifespan di FastAPI in app/main.py.
    """
    await engine.dispose()