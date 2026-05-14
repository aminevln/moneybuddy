"""
Schemi Pydantic per Chat.
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import MessageRole


# ============================================================
# INPUT
# ============================================================

class ChatMessageCreate(BaseModel):
    """Payload per inviare un nuovo messaggio user."""
    
    content: str = Field(min_length=1, max_length=4000)


# ============================================================
# OUTPUT
# ============================================================

class ChatMessageResponse(BaseModel):
    """Singolo messaggio (user o assistant) per la UI."""
    
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    session_id: UUID
    role: MessageRole
    content: str
    tool_calls: dict[str, Any] | None
    tokens_in: int | None
    tokens_out: int | None
    created_at: datetime


class ChatSendResponse(BaseModel):
    """
    Risposta dopo aver inviato un messaggio.
    
    user_message: il messaggio dell'utente
    assistant_messages: 1 o più messaggi dell'AI (può proporre + testo)
    """
    
    user_message: ChatMessageResponse
    assistant_messages: list[ChatMessageResponse]


class ChatHistoryResponse(BaseModel):
    """Storia chat ordinata cronologicamente."""
    
    session_id: UUID
    messages: list[ChatMessageResponse]

# ============================================================
# TOOL PROPOSAL CONFIRMATION
# ============================================================

class ProposalConfirmationResponse(BaseModel):
    """Response dopo confirm/reject di una proposta."""
    
    updated_message: ChatMessageResponse
    new_message: ChatMessageResponse