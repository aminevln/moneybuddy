"""
Service layer per la chat.

Versione 2 (5.E): supporta tool use.

Pipeline:
1. Salva messaggio user
2. Costruisce context (DB + RAG)
3. Recupera storia
4. Chiama Gemini con tools disponibili
5. Se l'LLM ha risposto con testo: salva risposta normale
   Se l'LLM ha chiamato un tool: crea proposta (status=pending)
   Se entrambi: salva testo + proposta
"""

import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.client import GeminiClient
from app.ai.context import build_chat_context
from app.ai.prompts import SYSTEM_PROMPT, format_user_context
from app.ai.tools import ALL_TOOLS
from app.models.chat import ChatMessage
from app.models.enums import MessageRole
from app.models.user import User
from app.repositories.chat import ChatRepository
from app.services.tool_proposals import ToolProposalService


logger = logging.getLogger(__name__)


class ChatService:
    def __init__(self, db: AsyncSession, gemini: GeminiClient) -> None:
        self.db = db
        self.gemini = gemini
        self.repo = ChatRepository(db)
        self.proposals = ToolProposalService(db)
    
    async def send_message(
        self,
        user: User,
        content: str,
    ) -> tuple[ChatMessage, list[ChatMessage]]:
        """
        Pipeline completa.
        
        Restituisce (user_message, [assistant_messages]).
        
        La lista assistant_messages può contenere:
        - 1 messaggio testuale (caso normale Q&A)
        - 1 messaggio proposta (caso tool call senza testo)
        - 2 messaggi (caso testo + proposta)
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
        # 3. Build context
        # ========================================================
        context = await build_chat_context(
            self.db, self.gemini, user, query_text=content
        )
        context_block = format_user_context(**context)
        
        # ========================================================
        # 4. Get recent history
        # ========================================================
        history = await self.repo.get_recent_messages(session.id, limit=10)
        history_for_llm = [m for m in history if m.id != user_message.id]
        history_text = self._format_history(history_for_llm)
        
        full_prompt = (
            f"{context_block}\n\n"
            f"# CRONOLOGIA RECENTE\n{history_text}\n\n"
            f"# NUOVO MESSAGGIO\n"
            f"Utente: {content}"
        )
        
        # ========================================================
        # 5. Call Gemini WITH tools
        # ========================================================
        assistant_messages: list[ChatMessage] = []
        
        try:
            text, tool_calls = await self.gemini.generate_with_tools(
                prompt=full_prompt,
                system_instruction=SYSTEM_PROMPT,
                tools=ALL_TOOLS,
                temperature=0.7,
            )
        except Exception as e:
            logger.exception("Gemini generate_with_tools failed in chat")
            text = (
                "Mi spiace, ho avuto un problema tecnico a rispondere. "
                "Riprova tra qualche istante."
            )
            tool_calls = []
        
        # ========================================================
        # 6. Handle response
        # ========================================================
        # Caso A: solo testo
        if text and not tool_calls:
            msg = await self.repo.add_message(
                session_id=session.id,
                user_id=user.id,
                role=MessageRole.ASSISTANT,
                content=text,
            )
            assistant_messages.append(msg)
        
        # Caso B: solo tool calls
        elif tool_calls and not text:
            for tc in tool_calls:
                proposal = await self._handle_tool_call(user, session.id, tc)
                if proposal:
                    assistant_messages.append(proposal)
        
        # Caso C: entrambi
        else:
            if text:
                msg = await self.repo.add_message(
                    session_id=session.id,
                    user_id=user.id,
                    role=MessageRole.ASSISTANT,
                    content=text,
                )
                assistant_messages.append(msg)
            for tc in tool_calls:
                proposal = await self._handle_tool_call(user, session.id, tc)
                if proposal:
                    assistant_messages.append(proposal)
        
        # Fallback: niente da Gemini (raro ma succede)
        if not assistant_messages:
            fallback = await self.repo.add_message(
                session_id=session.id,
                user_id=user.id,
                role=MessageRole.ASSISTANT,
                content="Non ho capito bene la tua richiesta. Puoi riformularla?",
            )
            assistant_messages.append(fallback)
        
        # Aggiorna last_message_at
        await self.repo.update_session_last_message_at(session.id)
        
        return user_message, assistant_messages
    
    # ============================================================
    # PRIVATE: handle a single tool call
    # ============================================================
    
    async def _handle_tool_call(
        self,
        user: User,
        session_id: UUID,
        tool_call: dict,
    ) -> ChatMessage | None:
        """
        Trasforma una tool call dell'LLM in una proposta salvata.
        
        Per ora supportiamo solo `propose_transaction`. In futuro
        aggiungeremo altri tool con uno switch.
        """
        name = tool_call.get("name")
        args = tool_call.get("args", {})
        
        if name == "propose_transaction":
            try:
                return await self.proposals.create_transaction_proposal(
                    user=user,
                    session_id=session_id,
                    args=args,
                )
            except ValueError as e:
                # Tool call con args invalidi: salviamo un messaggio di errore
                logger.warning(f"Invalid propose_transaction args: {e}")
                return await self.repo.add_message(
                    session_id=session_id,
                    user_id=user.id,
                    role=MessageRole.ASSISTANT,
                    content=(
                        "Ho provato a creare una proposta di transazione, ma "
                        "alcuni dati non sono chiari. Puoi essere più specifico? "
                        "(importo, descrizione, account)"
                    ),
                )
        
        # Tool sconosciuto
        logger.warning(f"Unknown tool called by LLM: {name}")
        return None
    
    # ============================================================
    # HELPERS
    # ============================================================
    
    @staticmethod
    def _format_history(messages: list[ChatMessage]) -> str:
        if not messages:
            return "(nessun messaggio precedente)"
        lines = []
        for m in messages:
            speaker = "Utente" if m.role == MessageRole.USER else "MoneyBuddy"
            lines.append(f"{speaker}: {m.content}")
        return "\n".join(lines)