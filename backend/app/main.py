"""
Entry point dell'applicazione FastAPI.

Per avviare in sviluppo:
    make backend

Documentazione automatica disponibile a:
    http://localhost:8000/docs
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import get_db, close_db_connections


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Funzione che gira all'avvio e allo shutdown dell'app.
    """
    # === Startup ===
    print(f"🚀 Starting {settings.app_name} in {settings.environment} mode")
    print(f"🔌 Connected to database (lazy: il pool si apre alla prima query)")
    yield
    # === Shutdown ===
    print(f"👋 Shutting down {settings.app_name}")
    await close_db_connections()
    print(f"🔌 Database pool closed")


# Creazione dell'applicazione FastAPI
app = FastAPI(
    title=settings.app_name,
    description="Personal finance AI assistant with RAG",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)


# ============================================================
# ENDPOINTS
# ============================================================

@app.get("/")
async def root():
    """Endpoint di benvenuto."""
    return {
        "name": settings.app_name,
        "version": "0.1.0",
        "status": "running",
    }


@app.get("/health")
async def health(db: AsyncSession = Depends(get_db)):
    """
    Health check endpoint.
    
    Verifica che:
    - L'app sia in esecuzione
    - La connessione al database funzioni
    - pgvector sia disponibile
    
    Usato da Docker, Kubernetes, monitoring per capire se l'app è viva.
    """
    health_status = {
        "status": "ok",
        "app": "ok",
        "database": "unknown",
        "pgvector": "unknown",
    }
    
    # Test connessione DB con una query semplice
    try:
        result = await db.execute(text("SELECT 1"))
        result.scalar()
        health_status["database"] = "ok"
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["database"] = f"error: {str(e)}"
    
    # Test che pgvector sia installato
    try:
        result = await db.execute(
            text("SELECT extname FROM pg_extension WHERE extname = 'vector'")
        )
        if result.scalar() == "vector":
            health_status["pgvector"] = "ok"
        else:
            health_status["status"] = "degraded"
            health_status["pgvector"] = "not installed"
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["pgvector"] = f"error: {str(e)}"
    
    # Se qualcosa è rotto, restituiamo 503 (Service Unavailable)
    if health_status["status"] != "ok":
        raise HTTPException(status_code=503, detail=health_status)
    
    return health_status