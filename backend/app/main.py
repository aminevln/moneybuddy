"""
Entry point dell'applicazione FastAPI.

Per avviare in sviluppo:
    make backend

Documentazione automatica disponibile a:
    http://localhost:8000/docs
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import get_db, close_db_connections
from app.api import accounts, analytics, assets, auth, budgets, categories, chat, debts, memory, transactions


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Funzione che gira all'avvio e allo shutdown dell'app."""
    print(f"🚀 Starting {settings.app_name} in {settings.environment} mode")
    # ============================================================
    # MIGRATIONS al boot (production-ready)
    # ============================================================
    # In dev locale usi `make migrate` esplicitamente prima dell'avvio.
    # In produzione (Railway) eseguiamo automaticamente alle startup,
    # così zero step manuali. Idempotente: se già aggiornato, no-op.
    if settings.environment == "production":
        print(f"⚙️  Running Alembic migrations...")
        try:
            from alembic.config import Config
            from alembic import command
            
            # Path assoluto a alembic.ini (Docker mette il codice in /app)
            alembic_cfg = Config("/app/alembic.ini")
            command.upgrade(alembic_cfg, "head")
            print(f"✅ Migrations applied successfully")
        except Exception as e:
            print(f"❌ Migrations failed: {e}")
            raise  # rilancia, così Railway capisce che il deploy è fallito
    # Seed delle categorie di sistema (idempotente)
    from app.db.session import AsyncSessionLocal
    from app.seed.system_categories import seed_system_categories
    
    async with AsyncSessionLocal() as db:
        try:
            created = await seed_system_categories(db)
            if created > 0:
                print(f"🌱 Seeded {created} system categories")
        except Exception as e:
            print(f"⚠️  Seed failed: {e}")
    
    from app.ai.client import init_gemini_client
    try:
        init_gemini_client()
        print(f"🤖 Gemini client initialized")
    except Exception as e:
        print(f"⚠️  Gemini init failed: {e}")
    
    print(f"🔌 Connected to database (lazy: il pool si apre alla prima query)")
    yield
    print(f"👋 Shutting down {settings.app_name}")
    await close_db_connections()
    print(f"🔌 Database pool closed")


app = FastAPI(
    title=settings.app_name,
    description="Personal finance AI assistant with RAG",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)


# ============================================================
# CORS MIDDLEWARE
# ============================================================
# Permette al frontend (su localhost:3000) di chiamare il backend
# (su localhost:8000). Senza questo, il browser blocca le richieste
# per la policy "same-origin".
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.all_cors_origins,  # ← cambiata in all_cors_origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ============================================================
# ROUTERS
# ============================================================
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(accounts.router)
app.include_router(transactions.router)
app.include_router(assets.router)
app.include_router(debts.router)
app.include_router(budgets.router)
app.include_router(analytics.router)
app.include_router(memory.router)
app.include_router(chat.router)
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
    """
    health_status = {
        "status": "ok",
        "app": "ok",
        "database": "unknown",
        "pgvector": "unknown",
    }
    
    try:
        result = await db.execute(text("SELECT 1"))
        result.scalar()
        health_status["database"] = "ok"
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["database"] = f"error: {str(e)}"
    
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
    
    if health_status["status"] != "ok":
        raise HTTPException(status_code=503, detail=health_status)
    
    return health_status