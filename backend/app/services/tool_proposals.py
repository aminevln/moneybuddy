"""
Service per gestire le "proposte" di tool call.

Quando l'LLM chiama un tool (es. propose_transaction), creiamo
un record `chat_message` con role=assistant e tool_calls JSONB.

L'utente vede una bolla speciale nella chat con bottoni Conferma / Annulla.
Quando conferma → eseguiamo davvero il tool (crea la transazione).
Quando rifiuta → marchiamo come rejected.
"""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import ChatMessage
from app.models.enums import MessageRole, TxnDirection
from app.models.user import User
from app.repositories.chat import ChatRepository
from app.schemas.transaction import TransactionCreate
from app.services.transaction import TransactionService


class ToolProposalService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.chat_repo = ChatRepository(db)
    
    # ============================================================
    # CREATE PROPOSAL (da tool call dell'LLM)
    # ============================================================
    
    async def create_transaction_proposal(
        self,
        user: User,
        session_id: UUID,
        args: dict[str, Any],
    ) -> ChatMessage:
        """
        Crea un messaggio assistant con una proposta di transazione (pending).
        
        Il content è un testo umano-leggibile per l'utente.
        Il tool_calls JSONB contiene gli args strutturati.
        """
        # Validazione minima degli args
        direction = args.get("direction")
        if direction not in ("income", "expense"):
            raise ValueError(f"direction non valido: {direction}")
        
        amount = args.get("amount")
        if amount is None or float(amount) <= 0:
            raise ValueError(f"amount non valido: {amount}")
        
        description = (args.get("description") or "").strip()
        if not description:
            raise ValueError("description mancante")
        
        account_id = args.get("account_id")
        if not account_id:
            raise ValueError("account_id mancante")
        
        # Costruisci il testo human-readable della proposta
        sign = "+" if direction == "income" else "−"
        label = "entrata" if direction == "income" else "spesa"
        content = (
            f"Ho capito che vuoi registrare una {label}.\n"
            f"{sign}{amount} € · {description}\n\n"
            f"Confermi?"
        )
        
        # Costruisci tool_calls JSONB
        # Normalizziamo i tipi prima di JSON-serialize
        normalized_args = {
            "direction": direction,
            "amount": str(amount),
            "description": description,
            "merchant": (args.get("merchant") or "").strip() or None,
            "account_id": str(account_id),
            "category_id": (
                str(args["category_id"])
                if args.get("category_id")
                else None
            ),
            "occurred_at": args.get(
                "occurred_at",
                datetime.now(timezone.utc).isoformat(),
            ),
        }
        
        tool_calls_payload = {
            "type": "transaction_proposal",
            "status": "pending",
            "args": normalized_args,
        }
        
        message = await self.chat_repo.add_message(
            session_id=session_id,
            user_id=user.id,
            role=MessageRole.ASSISTANT,
            content=content,
            tool_calls=tool_calls_payload,
        )
        return message
    
    # ============================================================
    # CONFIRM PROPOSAL
    # ============================================================
    
    async def confirm_proposal(
        self,
        user: User,
        message_id: UUID,
    ) -> tuple[ChatMessage, ChatMessage]:
        """
        Conferma una proposta pending.
        
        - Carica il messaggio della proposta
        - Verifica che sia ancora pending
        - Esegue il tool (crea la transazione)
        - Aggiorna il messaggio: status=confirmed + transaction_id
        - Crea un nuovo messaggio assistant di conferma
        
        Restituisce (proposta_aggiornata, messaggio_di_conferma).
        """
        # Carica il messaggio
        message = await self._get_proposal_message(message_id, user.id)
        
        tool_calls = message.tool_calls or {}
        if tool_calls.get("type") != "transaction_proposal":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Questo messaggio non è una proposta di transazione",
            )
        if tool_calls.get("status") != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Proposta già {tool_calls.get('status')}",
            )
        
        args = tool_calls["args"]
        
        # Esegui davvero il tool: crea la transazione
        txn_service = TransactionService(self.db)
        payload = TransactionCreate(
            account_id=UUID(args["account_id"]),
            category_id=UUID(args["category_id"]) if args.get("category_id") else None,
            direction=TxnDirection(args["direction"]),
            amount=Decimal(args["amount"]),
            description=args["description"],
            merchant=args.get("merchant"),
            occurred_at=datetime.fromisoformat(args["occurred_at"].replace("Z", "+00:00")),
        )
        txn = await txn_service.create_transaction(payload, user)
        
        # Aggiorna il messaggio proposta: status=confirmed + transaction_id
        # NOTA: SQLAlchemy non rileva modifiche dentro dict JSONB se non gli diciamo
        # Soluzione: riassegniamo l'intero JSONB
        new_tool_calls = dict(tool_calls)
        new_tool_calls["status"] = "confirmed"
        new_tool_calls["transaction_id"] = str(txn.id)
        new_tool_calls["confirmed_at"] = datetime.now(timezone.utc).isoformat()
        message.tool_calls = new_tool_calls
        await self.db.flush()
        await self.db.refresh(message)
        
        # Crea un nuovo messaggio assistant di conferma
        sign = "+" if args["direction"] == "income" else "−"
        confirmation_text = (
            f"Fatto! Ho registrato {sign}{args['amount']} € per "
            f"\"{args['description']}\". "
            f"Puoi vederla nella sezione Transazioni."
        )
        confirmation_msg = await self.chat_repo.add_message(
            session_id=message.session_id,
            user_id=user.id,
            role=MessageRole.ASSISTANT,
            content=confirmation_text,
        )
        
        return message, confirmation_msg
    
    # ============================================================
    # REJECT PROPOSAL
    # ============================================================
    
    async def reject_proposal(
        self,
        user: User,
        message_id: UUID,
    ) -> tuple[ChatMessage, ChatMessage]:
        """
        Rifiuta una proposta. Niente transazione creata.
        """
        message = await self._get_proposal_message(message_id, user.id)
        
        tool_calls = message.tool_calls or {}
        if tool_calls.get("status") != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Proposta già {tool_calls.get('status')}",
            )
        
        # Aggiorna status
        new_tool_calls = dict(tool_calls)
        new_tool_calls["status"] = "rejected"
        new_tool_calls["rejected_at"] = datetime.now(timezone.utc).isoformat()
        message.tool_calls = new_tool_calls
        await self.db.flush()
        await self.db.refresh(message)
        
        # Crea messaggio di conferma rifiuto
        rejection_msg = await self.chat_repo.add_message(
            session_id=message.session_id,
            user_id=user.id,
            role=MessageRole.ASSISTANT,
            content="Ok, niente registrazione. Se cambi idea, dimmelo.",
        )
        
        return message, rejection_msg
    
    # ============================================================
    # HELPERS
    # ============================================================
    
    async def _get_proposal_message(
        self, message_id: UUID, user_id: UUID
    ) -> ChatMessage:
        """Carica un messaggio dell'utente e verifica che esista."""
        from sqlalchemy import select
        result = await self.db.execute(
            select(ChatMessage).where(
                ChatMessage.id == message_id,
                ChatMessage.user_id == user_id,
            )
        )
        message = result.scalar_one_or_none()
        if message is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Messaggio non trovato",
            )
        return message