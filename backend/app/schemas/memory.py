"""
Schemi Pydantic per MemoryChunk.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import MemoryKind


# ============================================================
# INPUT
# ============================================================

class MemoryChunkCreate(BaseModel):
    """
    Payload per creare un memory chunk.
    
    L'embedding viene calcolato lato server (chiamando Gemini),
    quindi NON è nel payload utente.
    """
    
    content: str = Field(min_length=1, max_length=2000)
    kind: MemoryKind
    importance: int = Field(default=5, ge=1, le=10)
    source_message_id: UUID | None = None
    source_txn_id: UUID | None = None
    valid_until: datetime | None = None


class MemorySearchQuery(BaseModel):
    """
    Payload per cercare memory chunks per similarity.
    """
    
    query: str = Field(min_length=1, max_length=2000)
    kind: MemoryKind | None = None     # filtra per tipo (opzionale)
    limit: int = Field(default=5, ge=1, le=20)
    min_importance: int = Field(default=1, ge=1, le=10)


# ============================================================
# OUTPUT
# ============================================================

class MemoryChunkResponse(BaseModel):
    """Rappresentazione pubblica di un memory chunk (senza embedding)."""
    
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    kind: MemoryKind
    content: str
    importance: int
    source_message_id: UUID | None
    source_txn_id: UUID | None
    valid_from: datetime
    valid_until: datetime | None
    last_accessed_at: datetime | None
    access_count: int
    created_at: datetime


class MemorySearchResult(BaseModel):
    """Risultato di similarity search: chunk + distanza."""
    
    chunk: MemoryChunkResponse
    distance: float     # cosine distance: 0 = identico, 2 = opposto
    similarity: float   # cosine similarity: 1 - distance / 2 (normalizzato 0-1, comodo)