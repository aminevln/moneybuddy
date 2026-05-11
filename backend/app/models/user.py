"""
Modelli User e Account.
"""

from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    Boolean,
    CHAR,
    CheckConstraint,
    Enum as SAEnum,
    ForeignKey,
    Numeric,
    SmallInteger,
    Text,
)
from sqlalchemy.dialects.postgresql import CITEXT
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import AccountType
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


if TYPE_CHECKING:
    # Importiamo solo per i type hints, evitando import circolari
    pass


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Utente dell'app."""
    
    __tablename__ = "users"
    
    email: Mapped[str] = mapped_column(CITEXT, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    display_name: Mapped[str] = mapped_column(Text, nullable=False)
    timezone: Mapped[str] = mapped_column(
        Text, nullable=False, server_default="Europe/Rome"
    )
    currency: Mapped[str] = mapped_column(
        CHAR(3), nullable=False, server_default="EUR"
    )
    salary_day: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    
    __table_args__ = (
        CheckConstraint(
            "salary_day IS NULL OR (salary_day BETWEEN 1 AND 31)",
            name="ck_users_salary_day_range",
        ),
    )
    
    # Relazioni (one-to-many)
    accounts: Mapped[list["Account"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Account(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Conto/contante/buoni pasto/carta dell'utente."""
    
    __tablename__ = "accounts"
    
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[AccountType] = mapped_column(
        SAEnum(
            AccountType,
            name="account_type",
            create_type=True,
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        nullable=False,
    )
    current_balance: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), nullable=False, server_default="0"
    )
    is_spendable: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="true"
    )
    
    user: Mapped["User"] = relationship(back_populates="accounts")