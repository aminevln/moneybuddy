"""
Repository per MemoryChunk.

Include similarity search via pgvector cosine distance (operatore <=>).
"""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import MemoryKind
from app.models.memory import MemoryChunk


class MemoryChunkRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
    
    # ============================================================
    # READ
    # ============================================================
    
    async def list_for_user(
        self,
        user_id: UUID,
        *,
        kind: MemoryKind | None = None,
        include_expired: bool = False,
        limit: int = 100,
    ) -> list[MemoryChunk]:
        """Lista chunk di un utente, opzionalmente filtrato per kind."""
        query = select(MemoryChunk).where(MemoryChunk.user_id == user_id)
        if kind is not None:
            query = query.where(MemoryChunk.kind == kind)
        if not include_expired:
            query = query.where(MemoryChunk.valid_until.is_(None))
        query = query.order_by(MemoryChunk.created_at.desc()).limit(limit)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_by_id_for_user(
        self, chunk_id: UUID, user_id: UUID
    ) -> MemoryChunk | None:
        result = await self.db.execute(
            select(MemoryChunk).where(
                MemoryChunk.id == chunk_id,
                MemoryChunk.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()
    
    # ============================================================
    # SIMILARITY SEARCH (RAG core)
    # ============================================================
    
    async def search_similar(
        self,
        user_id: UUID,
        query_embedding: list[float],
        *,
        kind: MemoryKind | None = None,
        limit: int = 5,
        min_importance: int = 1,
    ) -> list[tuple[MemoryChunk, float]]:
        """
        Cerca i chunk più simili a un embedding di query.
        
        Usa cosine distance (operatore <=> di pgvector).
        Più piccola la distance, più simile il chunk.
        
        Filtri applicati:
        - solo chunk dell'utente
        - solo chunk non scaduti (valid_until IS NULL o > now)
        - solo chunk con embedding valorizzato (NOT NULL)
        - opzionalmente filtra per kind
        - opzionalmente filtra per importanza minima
        
        Restituisce lista di (chunk, distance) ordinata per distance ASC.
        """
        # cosine distance operator (pgvector <=>)
        distance_col = MemoryChunk.embedding.cosine_distance(query_embedding).label("distance")
        
        query = (
            select(MemoryChunk, distance_col)
            .where(
                MemoryChunk.user_id == user_id,
                MemoryChunk.embedding.is_not(None),
                MemoryChunk.importance >= min_importance,
            )
        )
        if kind is not None:
            query = query.where(MemoryChunk.kind == kind)
        
        # Filtra chunk scaduti
        now = datetime.now(timezone.utc)
        query = query.where(
            (MemoryChunk.valid_until.is_(None)) | (MemoryChunk.valid_until > now)
        )
        
        query = query.order_by(distance_col).limit(limit)
        
        result = await self.db.execute(query)
        return [(row.MemoryChunk, row.distance) for row in result.all()]
    
    # ============================================================
    # WRITE
    # ============================================================
    
    async def create(
        self,
        user_id: UUID,
        content: str,
        kind: MemoryKind,
        embedding: list[float] | None = None,
        importance: int = 5,
        source_message_id: UUID | None = None,
        source_txn_id: UUID | None = None,
        valid_until: datetime | None = None,
    ) -> MemoryChunk:
        chunk = MemoryChunk(
            user_id=user_id,
            content=content,
            kind=kind,
            embedding=embedding,
            importance=importance,
            source_message_id=source_message_id,
            source_txn_id=source_txn_id,
            valid_until=valid_until,
        )
        self.db.add(chunk)
        await self.db.flush()
        await self.db.refresh(chunk)
        return chunk
    
    async def delete(self, chunk: MemoryChunk) -> None:
        await self.db.delete(chunk)
        await self.db.flush()
    
    async def mark_accessed(self, chunk_ids: list[UUID]) -> None:
        """
        Aggiorna last_accessed_at e access_count dei chunk usati.
        
        Usato dopo una similarity search: marchiamo i chunk recuperati
        come "letti recentemente". Servirà per memory lifecycle (Blocco 7).
        """
        if not chunk_ids:
            return
        now = datetime.now(timezone.utc)
        await self.db.execute(
            update(MemoryChunk)
            .where(MemoryChunk.id.in_(chunk_ids))
            .values(
                last_accessed_at=now,
                access_count=MemoryChunk.access_count + 1,
            )
        )
        await self.db.flush()