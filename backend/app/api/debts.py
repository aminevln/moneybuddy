"""
Endpoint per Debts.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.deps import get_current_user
from app.models.user import User
from app.repositories.debt import DebtRepository
from app.schemas.debt import DebtCreate, DebtResponse, DebtUpdate


router = APIRouter(prefix="/debts", tags=["Debts"])


@router.get(
    "",
    response_model=list[DebtResponse],
    summary="Lista dei debiti dell'utente",
)
async def list_debts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[DebtResponse]:
    repo = DebtRepository(db)
    debts = await repo.list_for_user(current_user.id)
    return [DebtResponse.model_validate(d) for d in debts]


@router.post(
    "",
    response_model=DebtResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crea un nuovo debito",
)
async def create_debt(
    payload: DebtCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DebtResponse:
    repo = DebtRepository(db)
    debt = await repo.create(payload, current_user.id)
    await db.commit()
    return DebtResponse.model_validate(debt)


@router.get(
    "/{debt_id}",
    response_model=DebtResponse,
    summary="Dettaglio debito",
)
async def get_debt(
    debt_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DebtResponse:
    repo = DebtRepository(db)
    debt = await repo.get_by_id_for_user(debt_id, current_user.id)
    if debt is None:
        raise HTTPException(status_code=404, detail="Debito non trovato")
    return DebtResponse.model_validate(debt)


@router.patch(
    "/{debt_id}",
    response_model=DebtResponse,
    summary="Aggiorna un debito",
)
async def update_debt(
    debt_id: UUID,
    payload: DebtUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DebtResponse:
    repo = DebtRepository(db)
    debt = await repo.get_by_id_for_user(debt_id, current_user.id)
    if debt is None:
        raise HTTPException(status_code=404, detail="Debito non trovato")
    debt = await repo.update(debt, payload)
    await db.commit()
    return DebtResponse.model_validate(debt)


@router.delete(
    "/{debt_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Elimina un debito",
)
async def delete_debt(
    debt_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    repo = DebtRepository(db)
    debt = await repo.get_by_id_for_user(debt_id, current_user.id)
    if debt is None:
        raise HTTPException(status_code=404, detail="Debito non trovato")
    await repo.delete(debt)
    await db.commit()