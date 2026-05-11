"""Modello MemoryChunk - il cuore del RAG."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import MemoryKind
from app.models.mixins import UUIDPrimaryKeyMixin


class MemoryChunk(UUIDPrimaryKeyMixin, Base):
    """
    Chunk di memoria contestuale dell'utente.
    
    Vi finiscono fatti, preferenze, eventi, riassunti, ecc.
    Ogni chunk ha un embedding vettoriale per la ricerca semantica.
    """
    
    __tablename__ = "memory_chunks"
    
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    kind: Mapped[MemoryKind] = mapped_column(
        SAEnum(
            MemoryKind,
            name="memory_kind",
            create_type=True,
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[Optional[list[float]]] = mapped_column(
        Vector(768),  # gemini-embedding-001 (dimensione compatta nativa)
        nullable=True,
    )
    importance: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, server_default="5"
    )
    source_message_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("chat_messages.id", ondelete="SET NULL"), nullable=True
    )
    source_txn_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True
    )
    valid_from: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    valid_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_accessed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    access_count: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default="0"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    
    __table_args__ = (
        CheckConstraint(
            "importance BETWEEN 1 AND 10",
            name="ck_memory_chunks_importance_range",
        ),
        # Indice IVFFlat per ricerca semantica (cosine distance)
        Index(
            "idx_memory_embedding",
            "embedding",
            postgresql_using="ivfflat",
            postgresql_with={"lists": 100},
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
        # Indice filtrato per kind, solo su chunks ancora validi
        Index(
            "idx_memory_user_kind",
            "user_id",
            "kind",
            postgresql_where="valid_until IS NULL",
        ),
    )