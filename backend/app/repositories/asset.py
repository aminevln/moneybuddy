"""
Repository per UserAsset.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import UserAsset
from app.schemas.asset import UserAssetCreate, UserAssetUpdate


class UserAssetRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
    
    async def list_for_user(self, user_id: UUID) -> list[UserAsset]:
        result = await self.db.execute(
            select(UserAsset)
            .where(UserAsset.user_id == user_id)
            .order_by(UserAsset.name)
        )
        return list(result.scalars().all())
    
    async def get_by_id_for_user(
        self, asset_id: UUID, user_id: UUID
    ) -> UserAsset | None:
        result = await self.db.execute(
            select(UserAsset).where(
                UserAsset.id == asset_id,
                UserAsset.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()
    
    async def create(self, payload: UserAssetCreate, user_id: UUID) -> UserAsset:
        asset = UserAsset(
            user_id=user_id,
            name=payload.name,
            asset_type=payload.asset_type,
            details=payload.details,
            asset_metadata=payload.metadata,
        )
        self.db.add(asset)
        await self.db.flush()
        await self.db.refresh(asset)
        return asset
    
    async def update(
        self, asset: UserAsset, payload: UserAssetUpdate
    ) -> UserAsset:
        update_data = payload.model_dump(exclude_unset=True)
        if "metadata" in update_data:
            update_data["asset_metadata"] = update_data.pop("metadata")
        for key, value in update_data.items():
            setattr(asset, key, value)
        await self.db.flush()
        await self.db.refresh(asset)
        return asset
    
    async def delete(self, asset: UserAsset) -> None:
        await self.db.delete(asset)
        await self.db.flush()