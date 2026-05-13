"""
Repository per analytics aggregati.

Tutti i calcoli sono sul mese corrente vs mese precedente.
Solo expense non voided vengono considerate per le spese.
"""

from datetime import date, datetime, time, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.enums import TxnDirection
from app.models.transaction import Transaction
from app.utils.periods import current_period_bounds
from app.models.enums import BudgetPeriod


class AnalyticsRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
    
    # ============================================================
    # PERIOD HELPERS
    # ============================================================
    
    @staticmethod
    def _previous_month_bounds(today: date | None = None) -> tuple[date, date]:
        """Restituisce inizio e fine del mese PRECEDENTE."""
        if today is None:
            today = date.today()
        
        first_of_current = today.replace(day=1)
        # Sottrarre 1 giorno → ultimo del mese scorso
        last_of_prev = first_of_current.replace(day=1)
        from datetime import timedelta
        last_of_prev = first_of_current - timedelta(days=1)
        first_of_prev = last_of_prev.replace(day=1)
        return first_of_prev, last_of_prev
    
    @staticmethod
    def _to_utc_range(start: date, end: date) -> tuple[datetime, datetime]:
        """Converte (date, date) in (datetime UTC start, datetime UTC end)."""
        start_dt = datetime.combine(start, time.min, tzinfo=timezone.utc)
        end_dt = datetime.combine(end, time.max, tzinfo=timezone.utc)
        return start_dt, end_dt
    
    # ============================================================
    # MONTHLY COMPARISON
    # ============================================================
    
    async def _sum_for_period(
        self,
        user_id: UUID,
        direction: TxnDirection,
        period_start: date,
        period_end: date,
    ) -> Decimal:
        """Somma transactions di una direction nel periodo."""
        start_dt, end_dt = self._to_utc_range(period_start, period_end)
        
        result = await self.db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(
                Transaction.user_id == user_id,
                Transaction.direction == direction,
                Transaction.voided_at.is_(None),
                Transaction.occurred_at >= start_dt,
                Transaction.occurred_at <= end_dt,
            )
        )
        return Decimal(str(result.scalar_one()))
    
    async def get_monthly_comparison(self, user_id: UUID) -> dict:
        """Confronto income/expense mese corrente vs precedente."""
        cur_start, cur_end = current_period_bounds(BudgetPeriod.MONTHLY)
        prev_start, prev_end = self._previous_month_bounds()
        
        cur_income = await self._sum_for_period(
            user_id, TxnDirection.INCOME, cur_start, cur_end
        )
        cur_expense = await self._sum_for_period(
            user_id, TxnDirection.EXPENSE, cur_start, cur_end
        )
        prev_income = await self._sum_for_period(
            user_id, TxnDirection.INCOME, prev_start, prev_end
        )
        prev_expense = await self._sum_for_period(
            user_id, TxnDirection.EXPENSE, prev_start, prev_end
        )
        
        return {
            "current_month_income": cur_income,
            "current_month_expense": cur_expense,
            "previous_month_income": prev_income,
            "previous_month_expense": prev_expense,
            "income_delta": cur_income - prev_income,
            "expense_delta": cur_expense - prev_expense,
            "current_month_start": cur_start,
            "current_month_end": cur_end,
            "previous_month_start": prev_start,
            "previous_month_end": prev_end,
        }
    
    # ============================================================
    # CATEGORY BREAKDOWN
    # ============================================================
    
    async def get_category_breakdown(
        self, user_id: UUID
    ) -> list[dict]:
        """
        Per il mese corrente, raggruppa le expense per categoria.
        
        Ritorna ordinato per total_spent DESC.
        Include categorie senza nome (transazioni senza category_id).
        """
        cur_start, cur_end = current_period_bounds(BudgetPeriod.MONTHLY)
        start_dt, end_dt = self._to_utc_range(cur_start, cur_end)
        
        # JOIN con categories per avere nome/colore
        query = (
            select(
                Transaction.category_id,
                Category.name.label("category_name"),
                Category.color.label("category_color"),
                func.sum(Transaction.amount).label("total"),
                func.count(Transaction.id).label("count"),
            )
            .outerjoin(Category, Category.id == Transaction.category_id)
            .where(
                Transaction.user_id == user_id,
                Transaction.direction == TxnDirection.EXPENSE,
                Transaction.voided_at.is_(None),
                Transaction.occurred_at >= start_dt,
                Transaction.occurred_at <= end_dt,
            )
            .group_by(Transaction.category_id, Category.name, Category.color)
            .order_by(func.sum(Transaction.amount).desc())
        )
        
        result = await self.db.execute(query)
        rows = result.all()
        
        return [
            {
                "category_id": str(row.category_id) if row.category_id else None,
                "category_name": row.category_name or "Senza categoria",
                "category_color": row.category_color,
                "total_spent": Decimal(str(row.total)),
                "transaction_count": row.count,
            }
            for row in rows
        ]