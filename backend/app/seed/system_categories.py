"""
Seed delle categorie di sistema.

Categorie standard che ogni utente vede automaticamente. Possiamo
modificare questa lista nel tempo: lo script è idempotente (se una
categoria esiste già, non viene duplicata).

Eseguito automaticamente dal lifespan di FastAPI alla prima startup,
oppure manualmente con: make seed
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category


# Lista canonica delle categorie di sistema.
# Format: (name, icon, color)
SYSTEM_CATEGORIES = [
    # Necessità
    ("Cibo & Spesa",        "shopping-cart",  "#10b981"),
    ("Casa & Bollette",     "home",           "#3b82f6"),
    ("Trasporti",           "car",            "#f59e0b"),
    ("Salute",              "heart-pulse",    "#ef4444"),
    
    # Tempo libero
    ("Ristoranti",          "utensils",       "#f97316"),
    ("Svago",               "ticket",         "#a855f7"),
    ("Abbigliamento",       "shirt",          "#ec4899"),
    ("Tecnologia",          "laptop",         "#06b6d4"),
    
    # Servizi
    ("Abbonamenti",         "repeat",         "#8b5cf6"),
    ("Istruzione",          "book-open",      "#14b8a6"),
    ("Viaggi",              "plane",          "#0ea5e9"),
    
    # Finanze
    ("Stipendio",           "briefcase",      "#22c55e"),
    ("Investimenti",        "trending-up",    "#16a34a"),
    ("Rate & Mutui",        "credit-card",    "#dc2626"),
    
    # Catch-all
    ("Altro",               "circle",         "#64748b"),
]


async def seed_system_categories(db: AsyncSession) -> int:
    """
    Inserisce le categorie di sistema se mancanti.
    
    Restituisce il numero di categorie create (0 se erano già tutte presenti).
    """
    # Recupera tutti i nomi delle categorie di sistema già nel DB
    result = await db.execute(
        select(Category.name).where(Category.user_id.is_(None))
    )
    existing_names = set(result.scalars().all())
    
    created = 0
    for name, icon, color in SYSTEM_CATEGORIES:
        if name in existing_names:
            continue
        db.add(Category(
            user_id=None,    # categoria di sistema
            name=name,
            icon=icon,
            color=color,
        ))
        created += 1
    
    if created > 0:
        await db.commit()
    
    return created