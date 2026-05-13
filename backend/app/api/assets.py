"""
Endpoint per UserAssets.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.deps import get_current_user
from app.models.user import User
from app.repositories.asset import UserAssetRepository
from app.schemas.asset import (
    UserAssetCreate,
    UserAssetResponse,
    UserAssetUpdate,
)


router = APIRouter(prefix="/assets", tags=["Assets"])


@router.get(
    "",
    response_model=list[UserAssetResponse],
    summary="Lista degli asset dell'utente",
)
async def list_assets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[UserAssetResponse]:
    repo = UserAssetRepository(db)
    assets = await repo.list_for_user(current_user.id)
    return [UserAssetResponse.model_validate(a) for a in assets]


@router.post(
    "",
    response_model=UserAssetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crea un nuovo asset",
)
async def create_asset(
    payload: UserAssetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserAssetResponse:
    repo = UserAssetRepository(db)
    asset = await repo.create(payload, current_user.id)
    await db.commit()
    return UserAssetResponse.model_validate(asset)


@router.get(
    "/{asset_id}",
    response_model=UserAssetResponse,
    summary="Dettaglio asset",
)
async def get_asset(
    asset_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserAssetResponse:
    repo = UserAssetRepository(db)
    asset = await repo.get_by_id_for_user(asset_id, current_user.id)
    if asset is None:
        raise HTTPException(status_code=404, detail="Asset non trovato")
    return UserAssetResponse.model_validate(asset)


@router.patch(
    "/{asset_id}",
    response_model=UserAssetResponse,
    summary="Aggiorna un asset",
)
async def update_asset(
    asset_id: UUID,
    payload: UserAssetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserAssetResponse:
    repo = UserAssetRepository(db)
    asset = await repo.get_by_id_for_user(asset_id, current_user.id)
    if asset is None:
        raise HTTPException(status_code=404, detail="Asset non trovato")
    asset = await repo.update(asset, payload)
    await db.commit()
    return UserAssetResponse.model_validate(asset)


@router.delete(
    "/{asset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Elimina un asset",
)
async def delete_asset(
    asset_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    repo = UserAssetRepository(db)
    asset = await repo.get_by_id_for_user(asset_id, current_user.id)
    if asset is None:
        raise HTTPException(status_code=404, detail="Asset non trovato")
    await repo.delete(asset)
    await db.commit()