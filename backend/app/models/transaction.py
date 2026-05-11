"""
Modelli Transaction e RecurringTransaction.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    Numeric,
    SmallInteger,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import RecurrenceFreq, TxnDirection, TxnStatus
from app.models.mixins import UUIDPrimaryKeyMixin


class Transaction(UUIDPrimaryKeyMixin, Base):
    """Transazione (entrata, uscita o trasferimento). Append-only ledger."""
    
    __tablename__ = "transactions"
    
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    account_id: Mapped[UUID] = mapped_column(
        ForeignKey("accounts.id"), nullable=False
    )
    category_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("categories.id"), nullable=True
    )
    direction: Mapped[TxnDirection] = mapped_column(
        SAEnum(
            TxnDirection,
            name="txn_direction",
            create_type=True,
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        nullable=False,
    )
    status: Mapped[TxnStatus] = mapped_column(
        SAEnum(
            TxnStatus,
            name="txn_status",
            create_type=True,
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        nullable=False,
        server_default=TxnStatus.CLEARED.value,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    merchant: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    voided_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    txn_metadata: Mapped[dict[str, Any]] = mapped_column(
        "metadata",  # nome reale della colonna nel DB (`metadata` è riservata in Python)
        JSONB,
        nullable=False,
        server_default="{}",
    )
    
    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_transactions_amount_positive"),
        Index("idx_txn_user_date", "user_id", "occurred_at"),
        Index(
            "idx_txn_user_status",
            "user_id",
            "status",
            postgresql_where="voided_at IS NULL",
        ),
        Index(
            "idx_txn_metadata",
            "metadata",
            postgresql_using="gin",
        ),
    )


class RecurringTransaction(UUIDPrimaryKeyMixin, Base):
    """Template di transazione ricorrente (stipendio, affitto, abbonamento)."""
    
    __tablename__ = "recurring_transactions"
    
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    account_id: Mapped[UUID] = mapped_column(
        ForeignKey("accounts.id"), nullable=False
    )
    category_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("categories.id"), nullable=True
    )
    direction: Mapped[TxnDirection] = mapped_column(
        SAEnum(
            TxnDirection,
            name="txn_direction",
            create_type=False,  # già creato sopra
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        nullable=False,
    )
    frequency: Mapped[RecurrenceFreq] = mapped_column(
        SAEnum(
            RecurrenceFreq,
            name="recurrence_freq",
            create_type=True,
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    day_of_month: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    next_occurrence: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")