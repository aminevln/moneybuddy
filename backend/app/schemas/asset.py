"""
Schemi Pydantic per UserAsset.
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class UserAssetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    asset_type: str = Field(min_length=1, max_length=50)
    # Note libere (es. "Fiat Panda 2018, 80.000 km")
    details: str | None = Field(default=None, max_length=500)
    metadata: dict[str, Any] = Field(default_factory=dict)


class UserAssetUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    asset_type: str | None = Field(default=None, min_length=1, max_length=50)
    details: str | None = Field(default=None, max_length=500)
    metadata: dict[str, Any] | None = None


class UserAssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    name: str
    asset_type: str
    details: str | None
    metadata: dict[str, Any] = Field(
        validation_alias="asset_metadata",
        serialization_alias="metadata",
    )
    created_at: datetime