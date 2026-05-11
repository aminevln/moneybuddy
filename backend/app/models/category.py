"""
Modello Category.
"""

from typing import Optional
from uuid import UUID

from sqlalchemy import ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import UUIDPrimaryKeyMixin


class Category(UUIDPrimaryKeyMixin, Base):
    """Categoria di transazione (es. 'cibo', 'trasporto')."""
    
    __tablename__ = "categories"
    
    # NULL = categoria di sistema, altrimenti appartiene a un utente
    user_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    parent_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("categories.id"),
        nullable=True,
    )
    icon: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    color: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_categories_user_name"),
    )