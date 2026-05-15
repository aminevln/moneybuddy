"""
Endpoint per Accounts.

- GET    /accounts             → lista
- GET    /accounts/summary     → aggregato (totale spendibile, ecc.)
- POST   /accounts             → crea
- GET    /accounts/{id}        → singolo
- PATCH  /accounts/{id}        → aggiorna (no balance, no type)
- DELETE /accounts/{id}        → elimina
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.deps import get_current_user
from app.models.user import User
from app.repositories.account import AccountRepository
from app.schemas.account import (
    AccountCreate,
    AccountResponse,
    AccountsSummary,
    AccountUpdate,
)


router = APIRouter(prefix="/accounts", tags=["Accounts"])


# ============================================================
# LIST
# ============================================================

@router.get(
    "",
    response_model=list[AccountResponse],
    summary="Lista degli account dell'utente",
)
async def list_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[AccountResponse]:
    repo = AccountRepository(db)
    accounts = await repo.list_for_user(current_user.id)
    return [AccountResponse.model_validate(a) for a in accounts]


# ============================================================
# SUMMARY (aggregato)
# ============================================================
# IMPORTANTE: questa route DEVE essere definita PRIMA di /{account_id}
# altrimenti FastAPI matcherebbe "summary" come un account_id.

@router.get(
    "/summary",
    response_model=AccountsSummary,
    summary="Sommario aggregato (totale spendibile, buoni pasto, investimenti)",
)
async def get_accounts_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AccountsSummary:
    repo = AccountRepository(db)
    summary = await repo.get_summary(current_user.id)
    return AccountsSummary(**summary)


# ============================================================
# CREATE
# ============================================================

@router.post(
    "",
    response_model=AccountResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crea un nuovo account",
)
async def create_account(
    payload: AccountCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AccountResponse:
    repo = AccountRepository(db)
    
    if await repo.name_exists_for_user(payload.name, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Hai già un account chiamato '{payload.name}'",
        )
    
    account = await repo.create(payload, current_user.id)
    await db.commit()
    return AccountResponse.model_validate(account)


# ============================================================
# GET ONE
# ============================================================

@router.get(
    "/{account_id}",
    response_model=AccountResponse,
    summary="Dettaglio di un account",
)
async def get_account(
    account_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AccountResponse:
    repo = AccountRepository(db)
    account = await repo.get_by_id_for_user(account_id, current_user.id)
    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account non trovato",
        )
    return AccountResponse.model_validate(account)


# ============================================================
# UPDATE
# ============================================================

@router.patch(
    "/{account_id}",
    response_model=AccountResponse,
    summary="Aggiorna un account (nome e is_spendable)",
)
async def update_account(
    account_id: UUID,
    payload: AccountUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AccountResponse:
    repo = AccountRepository(db)
    
    account = await repo.get_by_id_for_user(account_id, current_user.id)
    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account non trovato",
        )
    
    # Check nome duplicato se sta cambiando
    if payload.name is not None and payload.name != account.name:
        if await repo.name_exists_for_user(
            payload.name, current_user.id, exclude_id=account_id
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Hai già un account chiamato '{payload.name}'",
            )
    
    account = await repo.update(account, payload)
    await db.commit()
    return AccountResponse.model_validate(account)


# ============================================================
# DELETE
# ============================================================

@router.delete(
    "/{account_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Elimina un account (solo se senza transazioni)",
)
async def delete_account(
    account_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    repo = AccountRepository(db)
    account = await repo.get_by_id_for_user(account_id, current_user.id)
    if account is None:
        raise HTTPException(status_code=404, detail="Account non trovato")
    
    # Pre-check: ci sono transazioni? Non possiamo eliminare.
    from sqlalchemy import func, select
    from app.models.transaction import Transaction
    
    result = await db.execute(
        select(func.count(Transaction.id))
        .where(Transaction.account_id == account_id)
    )
    txn_count = result.scalar_one()
    
    if txn_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Impossibile eliminare: questo account ha {txn_count} "
                f"transazione/i collegate. Puoi disattivarlo invece di eliminarlo."
            ),
        )
    
    await repo.delete(account)
    await db.commit()