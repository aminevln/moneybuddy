"""
Schemi Pydantic per UserAsset.
"""

from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class UserAssetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    asset_type: str = Field(min_length=1, max_length=50)
    attributes: dict[str, Any] = Field(default_factory=dict)


class UserAssetUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    asset_type: str | None = Field(default=None, min_length=1, max_length=50)
    attributes: dict[str, Any] | None = None


class UserAssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    name: str
    asset_type: str
    attributes: dict[str, Any]