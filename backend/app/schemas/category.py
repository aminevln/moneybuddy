"""
Schemi Pydantic per Category.
"""

from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# INPUT SCHEMAS
# ============================================================

class CategoryCreate(BaseModel):
    """Payload di creazione categoria custom (user-owned)."""
    
    name: str = Field(min_length=1, max_length=100)
    parent_id: Optional[UUID] = None
    icon: Optional[str] = Field(default=None, max_length=50)
    color: Optional[str] = Field(default=None, max_length=20)


class CategoryUpdate(BaseModel):
    """Payload di aggiornamento. Tutti i campi opzionali."""
    
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    parent_id: Optional[UUID] = None
    icon: Optional[str] = Field(default=None, max_length=50)
    color: Optional[str] = Field(default=None, max_length=20)


# ============================================================
# OUTPUT SCHEMAS
# ============================================================

class CategoryResponse(BaseModel):
    """Rappresentazione "pubblica" di una categoria."""
    
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: Optional[UUID]   # None se categoria di sistema
    name: str
    parent_id: Optional[UUID]
    icon: Optional[str]
    color: Optional[str]
    is_system: bool           # comodità derivata: user_id is None