"""
Entry point dell'applicazione FastAPI.

Per avviare in sviluppo:
    uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Documentazione automatica disponibile a:
    http://localhost:8000/docs
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Funzione che gira all'avvio e allo shutdown dell'app.
    
    Tutto prima del `yield` è eseguito all'avvio.
    Tutto dopo è eseguito allo shutdown (es. chiudere connessioni).
    
    Nei prossimi blocchi qui apriremo il pool di connessioni al DB.
    """
    # === Startup ===
    print(f"🚀 Starting {settings.app_name} in {settings.environment} mode")
    yield
    # === Shutdown ===
    print(f"👋 Shutting down {settings.app_name}")


# Creazione dell'applicazione FastAPI
app = FastAPI(
    title=settings.app_name,
    description="Personal finance AI assistant with RAG",
    version="0.1.0",
    lifespan=lifespan,
    # In produzione disabiliteremmo /docs, in dev è utile
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)


# ============================================================
# ENDPOINTS
# ============================================================

@app.get("/")
async def root():
    """Endpoint di benvenuto, utile per verificare che l'app sia su."""
    return {
        "name": settings.app_name,
        "version": "0.1.0",
        "status": "running",
    }


@app.get("/health")
async def health():
    """
    Health check endpoint.
    
    Usato da Docker, Kubernetes, load balancer per sapere se l'app
    è viva. Nei prossimi blocchi aggiungeremo qui anche il check
    della connessione al database.
    """
    return {"status": "ok"}