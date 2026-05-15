"""Repository per PasswordResetToken."""

import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.password_reset import PasswordResetToken


# Scadenza token: 1 ora
TOKEN_EXPIRATION_HOURS = 1


class PasswordResetTokenRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
    
    async def create_for_user(self, user_id: UUID) -> PasswordResetToken:
        """
        Crea un nuovo token random per l'utente.
        
        Token: 32 byte url-safe = ~43 caratteri, ~256 bit di entropia.
        """
        token_str = secrets.token_urlsafe(32)
        expires = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRATION_HOURS)
        
        token = PasswordResetToken(
            user_id=user_id,
            token=token_str,
            expires_at=expires,
        )
        self.db.add(token)
        await self.db.flush()
        await self.db.refresh(token)
        return token
    
    async def get_valid_by_token(self, token_str: str) -> PasswordResetToken | None:
        """
        Trova un token se esiste, non è scaduto e non è già stato usato.
        """
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.token == token_str,
                PasswordResetToken.expires_at > now,
                PasswordResetToken.used_at.is_(None),
            )
        )
        return result.scalar_one_or_none()
    
    async def mark_used(self, token: PasswordResetToken) -> None:
        """Marca il token come usato (audit trail)."""
        token.used_at = datetime.now(timezone.utc)
        await self.db.flush()