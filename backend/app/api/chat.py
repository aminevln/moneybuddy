"""
Endpoint per la chat.

- POST /chat/messages       → invia un messaggio, ricevi risposta AI
- GET /chat/messages        → recupera l'intera storia
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.client import GeminiClient, get_gemini_client
from app.db.session import get_db
from app.deps import get_current_user
from app.models.user import User
from app.repositories.chat import ChatRepository
from app.schemas.chat import (
    ChatHistoryResponse,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatSendResponse,
)
from app.services.chat import ChatService
from uuid import UUID

from app.schemas.chat import ProposalConfirmationResponse
from app.services.tool_proposals import ToolProposalService


router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post(
    "/messages",
    response_model=ChatSendResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Invia un messaggio in chat, ricevi 1+ risposte di MoneyBuddy",
)
async def send_message(
    payload: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    gemini: GeminiClient = Depends(get_gemini_client),
) -> ChatSendResponse:
    service = ChatService(db, gemini)
    user_msg, assistant_msgs = await service.send_message(current_user, payload.content)
    await db.commit()
    
    return ChatSendResponse(
        user_message=ChatMessageResponse.model_validate(user_msg),
        assistant_messages=[
            ChatMessageResponse.model_validate(m) for m in assistant_msgs
        ],
    )


@router.get(
    "/messages",
    response_model=ChatHistoryResponse,
    summary="Storia completa della chat dell'utente",
)
async def get_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatHistoryResponse:
    repo = ChatRepository(db)
    session = await repo.get_or_create_session(current_user.id)
    messages = await repo.get_all_messages(session.id)
    await db.commit()    # per la session creata
    
    return ChatHistoryResponse(
        session_id=session.id,
        messages=[ChatMessageResponse.model_validate(m) for m in messages],
    )

@router.post(
    "/messages/{message_id}/confirm",
    response_model=ProposalConfirmationResponse,
    summary="Conferma una proposta di transazione",
)
async def confirm_proposal(
    message_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProposalConfirmationResponse:
    service = ToolProposalService(db)
    updated, new_msg = await service.confirm_proposal(current_user, message_id)
    await db.commit()
    return ProposalConfirmationResponse(
        updated_message=ChatMessageResponse.model_validate(updated),
        new_message=ChatMessageResponse.model_validate(new_msg),
    )


@router.post(
    "/messages/{message_id}/reject",
    response_model=ProposalConfirmationResponse,
    summary="Rifiuta una proposta di transazione",
)
async def reject_proposal(
    message_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProposalConfirmationResponse:
    service = ToolProposalService(db)
    updated, new_msg = await service.reject_proposal(current_user, message_id)
    await db.commit()
    return ProposalConfirmationResponse(
        updated_message=ChatMessageResponse.model_validate(updated),
        new_message=ChatMessageResponse.model_validate(new_msg),
    )