"""
Service per password reset.

Logica:
1. request_reset: crea token + lo logga (in dev) o invia mail (in prod futuro)
2. confirm_reset: valida token + aggiorna password + invalida token
"""

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.user import User
from app.repositories.password_reset import PasswordResetTokenRepository


logger = logging.getLogger(__name__)


class PasswordResetService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = PasswordResetTokenRepository(db)
    
    async def request_reset(self, email: str) -> None:
        """
        Crea un token di reset se l'email esiste.
        
        In dev: logga il token + link.
        In prod (futuro): invia email.
        
        ANTI-ENUMERATION: NON solleva eccezioni se l'email non esiste.
        """
        result = await self.db.execute(
            select(User).where(User.email == email.lower())
        )
        user = result.scalar_one_or_none()
        
        if user is None:
            logger.info(f"Password reset richiesto per email non registrata: {email}")
            return
        
        token = await self.repo.create_for_user(user.id)
        reset_url = f"http://localhost:3000/reset-password?token={token.token}"
        
        # In dev: log molto visibile del token
        logger.warning("=" * 80)
        logger.warning(f"🔑 PASSWORD RESET token per {user.email}")
        logger.warning(f"   Token: {token.token}")
        logger.warning(f"   Link:  {reset_url}")
        logger.warning(f"   Scade: {token.expires_at.isoformat()}")
        logger.warning("=" * 80)
    
    async def confirm_reset(self, token_str: str, new_password: str) -> User:
        """
        Conferma il reset: valida token, aggiorna password.
        
        Solleva ValueError se il token non è valido.
        """
        token = await self.repo.get_valid_by_token(token_str)
        if token is None:
            raise ValueError("Token non valido o scaduto")
        
        result = await self.db.execute(
            select(User).where(User.id == token.user_id)
        )
        user = result.scalar_one_or_none()
        if user is None:
            raise ValueError("Utente non trovato")
        
        # Aggiorna password
        user.password_hash = hash_password(new_password)
        
        # Marca token come usato (single-use)
        await self.repo.mark_used(token)
        
        await self.db.flush()
        return user