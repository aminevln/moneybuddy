"""
Repository per User.

Concentra le query DB sugli utenti. Gli endpoint non devono scrivere
SELECT/INSERT direttamente, ma chiamare metodi di questa classe.

Vantaggi:
- Testabilità (puoi mockare il repository nei test)
- Riusabilità (la stessa query usata da più endpoint)
- Manutenibilità (modifichi una query in un posto solo)
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate


class UserRepository:
    """Tutte le operazioni DB su User."""
    
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
    
    # ============================================================
    # READ
    # ============================================================
    
    async def get_by_id(self, user_id: UUID) -> User | None:
        """Restituisce l'utente con quell'id, o None."""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_email(self, email: str) -> User | None:
        """
        Restituisce l'utente con quella email, o None.
        
        Nota: la colonna `email` è di tipo CITEXT (case-insensitive),
        quindi 'MARIO@example.com' matcha 'mario@example.com'.
        """
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def email_exists(self, email: str) -> bool:
        """Verifica veloce se una email è già registrata."""
        user = await self.get_by_email(email)
        return user is not None
    
    # ============================================================
    # WRITE
    # ============================================================
    
    async def create(self, payload: UserCreate) -> User:
        """
        Crea un nuovo utente.
        
        - Hash della password (NON salviamo mai password in chiaro)
        - I default per timezone/currency vengono dal DB (server_default)
        
        Solleva un errore SQLAlchemy se l'email è già usata (constraint
        UNIQUE), ma è una protezione di sicurezza: gli endpoint dovrebbero
        chiamare email_exists() prima e restituire un 400 più carino.
        """
        user = User(
            email=payload.email,
            password_hash=hash_password(payload.password),
            display_name=payload.display_name,
        )
        self.db.add(user)
        await self.db.flush()       # genera l'ID senza fare commit
        await self.db.refresh(user) # carica server_default (timezone, currency, created_at)
        return user