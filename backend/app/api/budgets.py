"""
Endpoint per Budgets.

- GET    /budgets                  → lista basic (BudgetResponse)
- GET    /budgets/status           → lista con speso calcolato (BudgetStatus[]) ← principale
- POST   /budgets                  → crea
- GET    /budgets/{id}             → singolo basic
- PATCH  /budgets/{id}             → aggiorna
- DELETE /budgets/{id}             → elimina
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.deps import get_current_user
from app.models.user import User
from app.repositories.budget import BudgetRepository
from app.repositories.category import CategoryRepository
from app.schemas.budget import (
    BudgetCreate,
    BudgetResponse,
    BudgetStatus,
    BudgetUpdate,
)


router = APIRouter(prefix="/budgets", tags=["Budgets"])


async def _validate_category(
    db: AsyncSession, category_id: UUID | None, user_id: UUID
) -> None:
    """Se viene specificata una categoria, deve esistere ed essere visibile all'utente."""
    if category_id is None:
        return
    repo = CategoryRepository(db)
    category = await repo.get_by_id_for_user(category_id, user_id)
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Categoria non trovata",
        )


# ============================================================
# LIST (basic)
# ============================================================

@router.get(
    "",
    response_model=list[BudgetResponse],
    summary="Lista budget dell'utente (senza speso calcolato)",
)
async def list_budgets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[BudgetResponse]:
    repo = BudgetRepository(db)
    budgets = await repo.list_for_user(current_user.id)
    return [BudgetResponse.model_validate(b) for b in budgets]


# ============================================================
# LIST WITH STATUS (principale)
# ============================================================
# Importante: definita PRIMA di /{budget_id}

@router.get(
    "/status",
    response_model=list[BudgetStatus],
    summary="Lista budget con speso e residuo calcolati al volo",
)
async def list_budgets_with_status(
    only_active: bool = True,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[BudgetStatus]:
    repo = BudgetRepository(db)
    statuses = await repo.list_with_status(current_user.id, only_active=only_active)
    return [
        BudgetStatus(
            budget=BudgetResponse.model_validate(s["budget"]),
            spent=s["spent"],
            remaining=s["remaining"],
            percentage=s["percentage"],
            period_start=s["period_start"],
            period_end=s["period_end"],
            category_name=s["category_name"],
        )
        for s in statuses
    ]


# ============================================================
# CREATE
# ============================================================

@router.post(
    "",
    response_model=BudgetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crea un nuovo budget",
)
async def create_budget(
    payload: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BudgetResponse:
    await _validate_category(db, payload.category_id, current_user.id)
    repo = BudgetRepository(db)
    budget = await repo.create(payload, current_user.id)
    await db.commit()
    return BudgetResponse.model_validate(budget)


# ============================================================
# GET ONE
# ============================================================

@router.get(
    "/{budget_id}",
    response_model=BudgetResponse,
    summary="Dettaglio budget",
)
async def get_budget(
    budget_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BudgetResponse:
    repo = BudgetRepository(db)
    budget = await repo.get_by_id_for_user(budget_id, current_user.id)
    if budget is None:
        raise HTTPException(status_code=404, detail="Budget non trovato")
    return BudgetResponse.model_validate(budget)


# ============================================================
# UPDATE
# ============================================================

@router.patch(
    "/{budget_id}",
    response_model=BudgetResponse,
    summary="Aggiorna un budget",
)
async def update_budget(
    budget_id: UUID,
    payload: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BudgetResponse:
    repo = BudgetRepository(db)
    budget = await repo.get_by_id_for_user(budget_id, current_user.id)
    if budget is None:
        raise HTTPException(status_code=404, detail="Budget non trovato")
    
    # Se l'utente sta cambiando categoria, valida
    if payload.category_id is not None:
        await _validate_category(db, payload.category_id, current_user.id)
    
    budget = await repo.update(budget, payload)
    await db.commit()
    return BudgetResponse.model_validate(budget)


# ============================================================
# DELETE
# ============================================================

@router.delete(
    "/{budget_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Elimina un budget",
)
async def delete_budget(
    budget_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    repo = BudgetRepository(db)
    budget = await repo.get_by_id_for_user(budget_id, current_user.id)
    if budget is None:
        raise HTTPException(status_code=404, detail="Budget non trovato")
    await repo.delete(budget)
    await db.commit()