"""
Mixin classes per modelli SQLAlchemy.

Un mixin è una classe non-modello che fornisce colonne comuni
a più modelli, evitando ripetizione.
"""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column


class UUIDPrimaryKeyMixin:
    """Aggiunge una primary key UUID generata server-side."""
    
    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=func.uuid_generate_v4(),  # usa l'estensione uuid-ossp
    )


class TimestampMixin:
    """Aggiunge created_at e updated_at gestiti dal database."""
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )