"""Modello Budget."""

from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import Boolean, Date, Enum as SAEnum, ForeignKey, Index, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import BudgetPeriod
from app.models.mixins import UUIDPrimaryKeyMixin


class Budget(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "budgets"
    
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    category_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("categories.id"), nullable=True
    )
    period: Mapped[BudgetPeriod] = mapped_column(
        SAEnum(
            BudgetPeriod,
            name="budget_period",
            create_type=True,
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        nullable=False,
    )
    amount_limit: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    starts_on: Mapped[date] = mapped_column(Date, nullable=False)
    ends_on: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    
    __table_args__ = (
        Index("idx_budgets_user", "user_id", postgresql_where="is_active"),
    )