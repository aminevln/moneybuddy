"""
Endpoint di debug per la pipeline RAG.

Permettono di:
- Creare chunk manualmente per testare
- Listare i chunk dell'utente
- Cercare per similarity (vedere se RAG funziona)

In produzione probabilmente non esposti, ma utili in dev.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.client import GeminiClient, get_gemini_client
from app.db.session import get_db
from app.deps import get_current_user
from app.models.enums import MemoryKind
from app.models.user import User
from app.repositories.memory import MemoryChunkRepository
from app.schemas.memory import (
    MemoryChunkCreate,
    MemoryChunkResponse,
    MemorySearchQuery,
    MemorySearchResult,
)
from app.services.memory import MemoryService


router = APIRouter(prefix="/ai/memory", tags=["AI Memory (debug)"])


# ============================================================
# CREATE
# ============================================================

@router.post(
    "",
    response_model=MemoryChunkResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crea un memory chunk (debug)",
)
async def create_memory_chunk(
    payload: MemoryChunkCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    gemini: GeminiClient = Depends(get_gemini_client),
) -> MemoryChunkResponse:
    service = MemoryService(db, gemini)
    chunk = await service.create_chunk(
        user_id=current_user.id,
        content=payload.content,
        kind=payload.kind,
        importance=payload.importance,
        source_message_id=payload.source_message_id,
        source_txn_id=payload.source_txn_id,
    )
    await db.commit()
    return MemoryChunkResponse.model_validate(chunk)


# ============================================================
# LIST
# ============================================================

@router.get(
    "",
    response_model=list[MemoryChunkResponse],
    summary="Lista dei memory chunks dell'utente",
)
async def list_memory_chunks(
    kind: MemoryKind | None = None,
    include_expired: bool = False,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[MemoryChunkResponse]:
    repo = MemoryChunkRepository(db)
    chunks = await repo.list_for_user(
        current_user.id,
        kind=kind,
        include_expired=include_expired,
        limit=limit,
    )
    return [MemoryChunkResponse.model_validate(c) for c in chunks]


# ============================================================
# SEARCH (the wow moment!)
# ============================================================

@router.post(
    "/search",
    response_model=list[MemorySearchResult],
    summary="Cerca memory chunks per similarity semantica",
)
async def search_memory_chunks(
    payload: MemorySearchQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    gemini: GeminiClient = Depends(get_gemini_client),
) -> list[MemorySearchResult]:
    service = MemoryService(db, gemini)
    results = await service.search_similar(
        user_id=current_user.id,
        query=payload.query,
        kind=payload.kind,
        limit=payload.limit,
        min_importance=payload.min_importance,
    )
    await db.commit()    # per il mark_accessed
    
    return [
        MemorySearchResult(
            chunk=MemoryChunkResponse.model_validate(chunk),
            distance=float(distance),
            # cosine distance 0-2 → similarity 0-1 (invertita)
            similarity=max(0.0, 1.0 - float(distance) / 2.0),
        )
        for chunk, distance in results
    ]


# ============================================================
# DELETE
# ============================================================

@router.delete(
    "/{chunk_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Elimina un memory chunk",
)
async def delete_memory_chunk(
    chunk_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    repo = MemoryChunkRepository(db)
    chunk = await repo.get_by_id_for_user(chunk_id, current_user.id)
    if chunk is None:
        raise HTTPException(status_code=404, detail="Memory chunk non trovato")
    await repo.delete(chunk)
    await db.commit()