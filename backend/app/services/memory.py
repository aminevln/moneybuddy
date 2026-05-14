"""
Service layer per memoria RAG.

Responsabilità:
- Generare embeddings via Gemini
- Salvare chunks con embedding
- Cercare chunks per similarity
- Marcare chunks come "acceduti" (lifecycle)
"""

import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.client import GeminiClient
from app.models.enums import MemoryKind
from app.models.memory import MemoryChunk
from app.repositories.memory import MemoryChunkRepository


logger = logging.getLogger(__name__)


class MemoryService:
    def __init__(self, db: AsyncSession, gemini: GeminiClient) -> None:
        self.db = db
        self.gemini = gemini
        self.repo = MemoryChunkRepository(db)
    
    # ============================================================
    # CREATE
    # ============================================================
    
    async def create_chunk(
        self,
        user_id: UUID,
        content: str,
        kind: MemoryKind,
        *,
        importance: int = 5,
        source_message_id: UUID | None = None,
        source_txn_id: UUID | None = None,
    ) -> MemoryChunk:
        """
        Crea un chunk generando automaticamente l'embedding via Gemini.
        """
        # Genera embedding
        try:
            embedding = await self.gemini.embed_text(content)
        except Exception as e:
            logger.warning(f"Embedding generation failed, saving chunk without it: {e}")
            embedding = None
        
        chunk = await self.repo.create(
            user_id=user_id,
            content=content,
            kind=kind,
            embedding=embedding,
            importance=importance,
            source_message_id=source_message_id,
            source_txn_id=source_txn_id,
        )
        return chunk
    
    # ============================================================
    # SEARCH
    # ============================================================
    
    async def search_similar(
        self,
        user_id: UUID,
        query: str,
        *,
        kind: MemoryKind | None = None,
        limit: int = 5,
        min_importance: int = 1,
        mark_as_accessed: bool = True,
    ) -> list[tuple[MemoryChunk, float]]:
        """
        Cerca chunk semanticamente simili a `query`.
        
        Calcola l'embedding della query e fa similarity search.
        Se mark_as_accessed=True, aggiorna last_accessed_at dei chunk trovati.
        """
        # Calcola embedding della query
        query_embedding = await self.gemini.embed_text(query)
        
        results = await self.repo.search_similar(
            user_id=user_id,
            query_embedding=query_embedding,
            kind=kind,
            limit=limit,
            min_importance=min_importance,
        )
        
        # Marca come acceduti (utile per memory lifecycle)
        if mark_as_accessed and results:
            chunk_ids = [chunk.id for chunk, _ in results]
            await self.repo.mark_accessed(chunk_ids)
        
        return results