"""
Endpoint per Categories.

Tutti gli endpoint richiedono autenticazione (Depends(get_current_user)).

- GET    /categories          → lista (sistema + utente)
- POST   /categories          → crea (sempre user-owned)
- GET    /categories/{id}     → singola
- PATCH  /categories/{id}     → aggiorna (solo categorie dell'utente)
- DELETE /categories/{id}     → elimina (solo categorie dell'utente)
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.deps import get_current_user
from app.models.user import User
from app.repositories.category import CategoryRepository
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
)


router = APIRouter(prefix="/categories", tags=["Categories"])


def _to_response(category) -> CategoryResponse:
    """Aggiunge il campo derivato is_system."""
    return CategoryResponse(
        id=category.id,
        user_id=category.user_id,
        name=category.name,
        parent_id=category.parent_id,
        icon=category.icon,
        color=category.color,
        is_system=category.user_id is None,
    )


# ============================================================
# LIST
# ============================================================

@router.get(
    "",
    response_model=list[CategoryResponse],
    summary="Lista delle categorie (sistema + utente)",
)
async def list_categories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[CategoryResponse]:
    repo = CategoryRepository(db)
    categories = await repo.list_for_user(current_user.id)
    return [_to_response(c) for c in categories]


# ============================================================
# CREATE
# ============================================================

@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crea una nuova categoria personale",
)
async def create_category(
    payload: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CategoryResponse:
    repo = CategoryRepository(db)
    
    # Niente nomi duplicati per lo stesso utente
    if await repo.name_exists_for_user(payload.name, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Hai già una categoria chiamata '{payload.name}'",
        )
    
    # Se viene specificato un parent, verifichiamo che sia visibile all'utente
    if payload.parent_id:
        parent = await repo.get_by_id_for_user(payload.parent_id, current_user.id)
        if parent is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Categoria padre non trovata",
            )
    
    category = await repo.create(payload, current_user.id)
    await db.commit()
    return _to_response(category)


# ============================================================
# GET ONE
# ============================================================

@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Dettaglio di una categoria",
)
async def get_category(
    category_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CategoryResponse:
    repo = CategoryRepository(db)
    category = await repo.get_by_id_for_user(category_id, current_user.id)
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria non trovata",
        )
    return _to_response(category)


# ============================================================
# UPDATE
# ============================================================

@router.patch(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Aggiorna una categoria (solo le tue, non quelle di sistema)",
)
async def update_category(
    category_id: UUID,
    payload: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CategoryResponse:
    repo = CategoryRepository(db)
    
    # Solo categorie possedute dall'utente: get_owned esclude quelle di sistema
    category = await repo.get_owned_by_user(category_id, current_user.id)
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria non trovata o non modificabile",
        )
    
    # Se si sta cambiando il nome, controlla che non vada in conflitto
    if payload.name is not None and payload.name != category.name:
        if await repo.name_exists_for_user(
            payload.name, current_user.id, exclude_id=category_id
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Hai già una categoria chiamata '{payload.name}'",
            )
    
    # Verifica parent se specificato
    if payload.parent_id is not None:
        if payload.parent_id == category_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Una categoria non può essere padre di se stessa",
            )
        parent = await repo.get_by_id_for_user(payload.parent_id, current_user.id)
        if parent is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Categoria padre non trovata",
            )
    
    category = await repo.update(category, payload)
    await db.commit()
    return _to_response(category)


# ============================================================
# DELETE
# ============================================================

@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Elimina una categoria (solo le tue)",
)
async def delete_category(
    category_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    repo = CategoryRepository(db)
    category = await repo.get_owned_by_user(category_id, current_user.id)
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria non trovata o non eliminabile",
        )
    
    await repo.delete(category)
    await db.commit()