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


router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post(
    "/messages",
    response_model=ChatSendResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Invia un messaggio in chat, ricevi la risposta di MoneyBuddy",
)
async def send_message(
    payload: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    gemini: GeminiClient = Depends(get_gemini_client),
) -> ChatSendResponse:
    service = ChatService(db, gemini)
    user_msg, assistant_msg = await service.send_message(current_user, payload.content)
    await db.commit()
    
    return ChatSendResponse(
        user_message=ChatMessageResponse.model_validate(user_msg),
        assistant_message=ChatMessageResponse.model_validate(assistant_msg),
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