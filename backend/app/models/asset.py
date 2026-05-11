"""Modello UserAsset (auto, casa, animali domestici, ecc.)."""

from typing import Any
from uuid import UUID

from sqlalchemy import ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import UUIDPrimaryKeyMixin


class UserAsset(UUIDPrimaryKeyMixin, Base):
    """'Cose' rilevanti dell'utente per il RAG: auto, casa, animali, ecc."""
    
    __tablename__ = "user_assets"
    
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    asset_type: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    attributes: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default="{}"
    )
    
    __table_args__ = (
        Index("idx_assets_user", "user_id"),
    )