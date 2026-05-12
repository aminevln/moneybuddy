"""
Endpoint per Transactions.

- GET    /transactions           → lista paginata con filtri
- POST   /transactions           → crea
- GET    /transactions/{id}      → singola
- PATCH  /transactions/{id}      → aggiorna campi non-finanziari
- DELETE /transactions/{id}      → void (soft delete, non hard delete)
"""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.deps import get_current_user
from app.models.enums import TxnDirection
from app.models.user import User
from app.repositories.transaction import TransactionRepository
from app.schemas.transaction import (
    TransactionCreate,
    TransactionListResponse,
    TransactionResponse,
    TransactionUpdate,
)
from app.services.transaction import TransactionService


router = APIRouter(prefix="/transactions", tags=["Transactions"])


# ============================================================
# LIST (paginata + filtri)
# ============================================================

@router.get(
    "",
    response_model=TransactionListResponse,
    summary="Lista transazioni paginata con filtri",
)
async def list_transactions(
    page: int = Query(default=1, ge=1, description="Pagina (1-indexed)"),
    page_size: int = Query(default=50, ge=1, le=200, description="Risultati per pagina"),
    include_voided: bool = Query(default=False, description="Includi transazioni annullate"),
    account_id: UUID | None = Query(default=None, description="Filtra per account"),
    category_id: UUID | None = Query(default=None, description="Filtra per categoria"),
    direction: TxnDirection | None = Query(default=None, description="income/expense/transfer"),
    date_from: datetime | None = Query(default=None, description="Solo transazioni dopo questa data"),
    date_to: datetime | None = Query(default=None, description="Solo transazioni prima di questa data"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TransactionListResponse:
    repo = TransactionRepository(db)
    items, total = await repo.list_for_user(
        current_user.id,
        page=page,
        page_size=page_size,
        include_voided=include_voided,
        account_id=account_id,
        category_id=category_id,
        direction=direction,
        date_from=date_from,
        date_to=date_to,
    )
    
    return TransactionListResponse(
        items=[TransactionResponse.model_validate(t) for t in items],
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total,
    )


# ============================================================
# CREATE
# ============================================================

@router.post(
    "",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crea una nuova transazione",
)
async def create_transaction(
    payload: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TransactionResponse:
    service = TransactionService(db)
    txn = await service.create_transaction(payload, current_user)
    await db.commit()
    return TransactionResponse.model_validate(txn)


# ============================================================
# GET ONE
# ============================================================

@router.get(
    "/{txn_id}",
    response_model=TransactionResponse,
    summary="Dettaglio transazione",
)
async def get_transaction(
    txn_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TransactionResponse:
    repo = TransactionRepository(db)
    txn = await repo.get_by_id_for_user(txn_id, current_user.id)
    if txn is None:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transazione non trovata",
        )
    return TransactionResponse.model_validate(txn)


# ============================================================
# UPDATE
# ============================================================

@router.patch(
    "/{txn_id}",
    response_model=TransactionResponse,
    summary="Aggiorna campi non-finanziari (description, category, ecc.)",
)
async def update_transaction(
    txn_id: UUID,
    payload: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TransactionResponse:
    service = TransactionService(db)
    txn = await service.update_transaction(txn_id, payload, current_user)
    await db.commit()
    return TransactionResponse.model_validate(txn)


# ============================================================
# VOID (soft delete)
# ============================================================

@router.delete(
    "/{txn_id}",
    response_model=TransactionResponse,
    summary="Annulla una transazione (soft delete)",
)
async def void_transaction(
    txn_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TransactionResponse:
    """
    A differenza di Categories e Accounts dove DELETE = remove,
    qui DELETE = void (la transazione resta in DB per audit).
    Restituiamo 200 OK con la transazione voided invece di 204.
    """
    service = TransactionService(db)
    txn = await service.void_transaction(txn_id, current_user)
    await db.commit()
    return TransactionResponse.model_validate(txn)