"""
Endpoint per RecurringTransactions.

- GET    /recurring-transactions             → lista
- POST   /recurring-transactions             → crea
- GET    /recurring-transactions/{id}        → singolo
- PATCH  /recurring-transactions/{id}        → aggiorna
- DELETE /recurring-transactions/{id}        → elimina

Una RecurringTransaction è il "template" di una spesa/entrata che si
ripete (stipendio, affitto, abbonamento, benzina settimanale, ecc).
Servono all'AI per fare forecast di cash flow.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.deps import get_current_user
from app.models.user import User
from app.repositories.account import AccountRepository
from app.repositories.recurring_transaction import RecurringTransactionRepository
from app.schemas.recurring_transaction import (
    RecurringTransactionCreate,
    RecurringTransactionResponse,
    RecurringTransactionUpdate,
)


router = APIRouter(
    prefix="/recurring-transactions",
    tags=["Recurring Transactions"],
)


# ============================================================
# LIST
# ============================================================

@router.get(
    "",
    response_model=list[RecurringTransactionResponse],
    summary="Lista delle transazioni ricorrenti dell'utente",
)
async def list_recurring(
    only_active: bool = Query(
        default=False,
        description="Se true, restituisce solo le ricorrenti attive",
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[RecurringTransactionResponse]:
    repo = RecurringTransactionRepository(db)
    items = await repo.list_for_user(current_user.id, only_active=only_active)
    return [RecurringTransactionResponse.model_validate(i) for i in items]


# ============================================================
# CREATE
# ============================================================

@router.post(
    "",
    response_model=RecurringTransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crea una nuova transazione ricorrente",
)
async def create_recurring(
    payload: RecurringTransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RecurringTransactionResponse:
    # Verifica che l'account specificato esista e appartenga all'utente
    account_repo = AccountRepository(db)
    account = await account_repo.get_by_id_for_user(payload.account_id, current_user.id)
    if account is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account non trovato",
        )
    
    repo = RecurringTransactionRepository(db)
    recurring = await repo.create(payload, current_user.id)
    await db.commit()
    return RecurringTransactionResponse.model_validate(recurring)


# ============================================================
# GET ONE
# ============================================================

@router.get(
    "/{recurring_id}",
    response_model=RecurringTransactionResponse,
    summary="Dettaglio di una transazione ricorrente",
)
async def get_recurring(
    recurring_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RecurringTransactionResponse:
    repo = RecurringTransactionRepository(db)
    recurring = await repo.get_by_id_for_user(recurring_id, current_user.id)
    if recurring is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transazione ricorrente non trovata",
        )
    return RecurringTransactionResponse.model_validate(recurring)


# ============================================================
# UPDATE
# ============================================================

@router.patch(
    "/{recurring_id}",
    response_model=RecurringTransactionResponse,
    summary="Aggiorna una transazione ricorrente",
)
async def update_recurring(
    recurring_id: UUID,
    payload: RecurringTransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RecurringTransactionResponse:
    repo = RecurringTransactionRepository(db)
    
    recurring = await repo.get_by_id_for_user(recurring_id, current_user.id)
    if recurring is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transazione ricorrente non trovata",
        )
    
    # Se sta cambiando account, verifica che il nuovo appartenga all'utente
    if payload.account_id is not None and payload.account_id != recurring.account_id:
        account_repo = AccountRepository(db)
        account = await account_repo.get_by_id_for_user(
            payload.account_id, current_user.id
        )
        if account is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account non trovato",
            )
    
    recurring = await repo.update(recurring, payload)
    await db.commit()
    return RecurringTransactionResponse.model_validate(recurring)


# ============================================================
# DELETE
# ============================================================

@router.delete(
    "/{recurring_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Elimina una transazione ricorrente",
)
async def delete_recurring(
    recurring_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    repo = RecurringTransactionRepository(db)
    recurring = await repo.get_by_id_for_user(recurring_id, current_user.id)
    if recurring is None:
        raise HTTPException(
            status_code=404,
            detail="Transazione ricorrente non trovata",
        )
    
    await repo.delete(recurring)
    await db.commit()