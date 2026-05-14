"""
Repository per ChatSession e ChatMessage.

Strategia per MVP: un'unica session per utente, riutilizzata sempre.
La trova con `get_or_create_session`.
"""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import ChatMessage, ChatSession
from app.models.enums import MessageRole


class ChatRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
    
    # ============================================================
    # SESSIONS
    # ============================================================
    
    async def get_or_create_session(self, user_id: UUID) -> ChatSession:
        """
        Restituisce la sessione corrente dell'utente.
        
        Se non esiste, ne crea una nuova.
        MVP: un'unica sessione per utente (quella più recente).
        """
        result = await self.db.execute(
            select(ChatSession)
            .where(ChatSession.user_id == user_id)
            .order_by(ChatSession.started_at.desc())
            .limit(1)
        )
        session = result.scalar_one_or_none()
        
        if session is None:
            session = ChatSession(user_id=user_id)
            self.db.add(session)
            await self.db.flush()
            await self.db.refresh(session)
        
        return session
    
    async def update_session_last_message_at(
        self, session_id: UUID
    ) -> None:
        """Aggiorna timestamp ultima attività della session."""
        await self.db.execute(
            update(ChatSession)
            .where(ChatSession.id == session_id)
            .values(last_message_at=datetime.now(timezone.utc))
        )
    
    # ============================================================
    # MESSAGES
    # ============================================================
    
    async def add_message(
        self,
        session_id: UUID,
        user_id: UUID,
        role: MessageRole,
        content: str,
        *,
        tool_calls: dict | None = None,
        tokens_in: int | None = None,
        tokens_out: int | None = None,
    ) -> ChatMessage:
        message = ChatMessage(
            session_id=session_id,
            user_id=user_id,
            role=role,
            content=content,
            tool_calls=tool_calls,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
        )
        self.db.add(message)
        await self.db.flush()
        await self.db.refresh(message)
        return message
    
    async def get_recent_messages(
        self, session_id: UUID, limit: int = 10
    ) -> list[ChatMessage]:
        """
        Ultimi N messaggi della session, ordinati CRONOLOGICAMENTE
        (i più vecchi prima — formato adatto a contesto LLM).
        """
        # Prendiamo gli ultimi N (DESC) e poi li reverse per avere cronologico ASC
        result = await self.db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(limit)
        )
        messages = list(result.scalars().all())
        return list(reversed(messages))
    
    async def get_all_messages(
        self, session_id: UUID
    ) -> list[ChatMessage]:
        """Tutti i messaggi di una session, cronologici."""
        result = await self.db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
        )
        return list(result.scalars().all())