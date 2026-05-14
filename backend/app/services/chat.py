"""
Service layer per la chat.

Orchestrazione:
1. Salva messaggio user
2. Costruisce context (DB + RAG)
3. Recupera storia (ultimi N messaggi)
4. Chiama Gemini con system_instruction + context + history + new message
5. Salva risposta assistant
6. Ritorna entrambi i messaggi
"""

import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.client import GeminiClient
from app.ai.context import build_chat_context
from app.ai.prompts import SYSTEM_PROMPT, format_user_context
from app.models.chat import ChatMessage
from app.models.enums import MessageRole
from app.models.user import User
from app.repositories.chat import ChatRepository


logger = logging.getLogger(__name__)


class ChatService:
    def __init__(self, db: AsyncSession, gemini: GeminiClient) -> None:
        self.db = db
        self.gemini = gemini
        self.repo = ChatRepository(db)
    
    async def send_message(
        self,
        user: User,
        content: str,
    ) -> tuple[ChatMessage, ChatMessage]:
        """
        Pipeline completa: salva user message, genera risposta AI, salva.
        
        Restituisce (user_message, assistant_message).
        """
        # ========================================================
        # 1. Get or create session
        # ========================================================
        session = await self.repo.get_or_create_session(user.id)
        
        # ========================================================
        # 2. Save user message
        # ========================================================
        user_message = await self.repo.add_message(
            session_id=session.id,
            user_id=user.id,
            role=MessageRole.USER,
            content=content,
        )
        
        # ========================================================
        # 3. Build full prompt
        # ========================================================
        context = await build_chat_context(
            self.db, self.gemini, user, query_text=content
        )
        context_block = format_user_context(**context)
        
        # ========================================================
        # 4. Get recent history (escludi il messaggio appena salvato)
        # ========================================================
        history = await self.repo.get_recent_messages(session.id, limit=10)
        # Rimuoviamo l'ultimo che è quello appena aggiunto (è già "current")
        history_for_llm = [m for m in history if m.id != user_message.id]
        
        # ========================================================
        # 5. Construct prompt for Gemini
        # ========================================================
        # Formato: context + history come testo + new user message
        history_text = self._format_history(history_for_llm)
        
        full_prompt = (
            f"{context_block}\n\n"
            f"# CRONOLOGIA RECENTE\n{history_text}\n\n"
            f"# NUOVO MESSAGGIO\n"
            f"Utente: {content}"
        )
        
        # ========================================================
        # 6. Call Gemini
        # ========================================================
        try:
            assistant_text = await self.gemini.generate_text(
                prompt=full_prompt,
                system_instruction=SYSTEM_PROMPT,
                temperature=0.7,
            )
        except Exception as e:
            logger.exception("Gemini generate_text failed in chat")
            assistant_text = (
                "Mi spiace, ho avuto un problema tecnico a rispondere. "
                "Riprova tra qualche istante."
            )
        
        # ========================================================
        # 7. Save assistant message
        # ========================================================
        assistant_message = await self.repo.add_message(
            session_id=session.id,
            user_id=user.id,    # uguale a quello user, è "la sua chat"
            role=MessageRole.ASSISTANT,
            content=assistant_text,
        )
        
        # Aggiorna last_message_at
        await self.repo.update_session_last_message_at(session.id)
        
        return user_message, assistant_message
    
    # ============================================================
    # HELPERS
    # ============================================================
    
    @staticmethod
    def _format_history(messages: list[ChatMessage]) -> str:
        """Trasforma una lista di ChatMessage in testo per il prompt."""
        if not messages:
            return "(nessun messaggio precedente)"
        
        lines = []
        for m in messages:
            speaker = "Utente" if m.role == MessageRole.USER else "MoneyBuddy"
            lines.append(f"{speaker}: {m.content}")
        return "\n".join(lines)