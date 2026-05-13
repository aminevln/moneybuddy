"""
Repository per Budget.

Include `compute_status` che calcola il "speso finora" per ogni budget
nel periodo corrente.
"""

from datetime import date, datetime, time, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.budget import Budget
from app.models.category import Category
from app.models.enums import TxnDirection
from app.models.transaction import Transaction
from app.schemas.budget import BudgetCreate, BudgetUpdate
from app.utils.periods import current_period_bounds


class BudgetRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
    
    # ============================================================
    # BASIC CRUD
    # ============================================================
    
    async def list_for_user(self, user_id: UUID) -> list[Budget]:
        """Tutti i budget dell'utente, ordinati per is_active DESC, poi per starts_on DESC."""
        result = await self.db.execute(
            select(Budget)
            .where(Budget.user_id == user_id)
            .order_by(Budget.is_active.desc(), Budget.starts_on.desc())
        )
        return list(result.scalars().all())
    
    async def get_by_id_for_user(
        self, budget_id: UUID, user_id: UUID
    ) -> Budget | None:
        result = await self.db.execute(
            select(Budget).where(
                Budget.id == budget_id,
                Budget.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()
    
    async def create(self, payload: BudgetCreate, user_id: UUID) -> Budget:
        budget = Budget(
            user_id=user_id,
            category_id=payload.category_id,
            period=payload.period,
            amount_limit=payload.amount_limit,
            starts_on=payload.starts_on or date.today(),
            ends_on=payload.ends_on,
            is_active=payload.is_active,
        )
        self.db.add(budget)
        await self.db.flush()
        await self.db.refresh(budget)
        return budget
    
    async def update(self, budget: Budget, payload: BudgetUpdate) -> Budget:
        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(budget, key, value)
        await self.db.flush()
        await self.db.refresh(budget)
        return budget
    
    async def delete(self, budget: Budget) -> None:
        await self.db.delete(budget)
        await self.db.flush()
    
    # ============================================================
    # STATUS CALCULATION
    # ============================================================
    
    async def compute_spent(
        self,
        user_id: UUID,
        category_id: UUID | None,
        period_start: date,
        period_end: date,
    ) -> Decimal:
        """
        Calcola la spesa totale (sum di expense non voided) nel periodo,
        opzionalmente filtrata per categoria.
        
        Converte date in datetime UTC per il confronto con occurred_at:
        - period_start → inizio della giornata 00:00:00 UTC
        - period_end → fine della giornata 23:59:59.999 UTC
        """
        start_dt = datetime.combine(period_start, time.min, tzinfo=timezone.utc)
        end_dt = datetime.combine(period_end, time.max, tzinfo=timezone.utc)
        
        query = (
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(
                Transaction.user_id == user_id,
                Transaction.direction == TxnDirection.EXPENSE,
                Transaction.voided_at.is_(None),
                Transaction.occurred_at >= start_dt,
                Transaction.occurred_at <= end_dt,
            )
        )
        if category_id is not None:
            query = query.where(Transaction.category_id == category_id)
        
        result = await self.db.execute(query)
        # COALESCE garantisce un numero, non NULL
        return Decimal(str(result.scalar_one()))
    
    async def list_with_status(
        self, user_id: UUID, only_active: bool = True
    ) -> list[dict]:
        """
        Per ogni budget dell'utente, calcola il "speso finora" nel periodo corrente.
        
        Restituisce una lista di dict pronti per essere convertiti in BudgetStatus.
        
        Strategia: 1 query per la lista budget + N query per gli "speso".
        Per ora va bene: pochi budget per utente. In futuro ottimizzabile con 1 query
        SQL complessa.
        """
        # Step 1: prendi i budget (con category in JOIN per il nome)
        query = (
            select(Budget, Category)
            .outerjoin(Category, Category.id == Budget.category_id)
            .where(Budget.user_id == user_id)
        )
        if only_active:
            query = query.where(Budget.is_active.is_(True))
        query = query.order_by(Budget.starts_on.desc())
        
        result = await self.db.execute(query)
        rows = result.all()
        
        # Step 2: per ogni budget, calcola lo speso
        statuses = []
        for budget, category in rows:
            period_start, period_end = current_period_bounds(budget.period)
            spent = await self.compute_spent(
                user_id=user_id,
                category_id=budget.category_id,
                period_start=period_start,
                period_end=period_end,
            )
            remaining = budget.amount_limit - spent
            percentage = (
                (spent / budget.amount_limit * Decimal("100"))
                if budget.amount_limit > 0
                else Decimal("0")
            )
            statuses.append({
                "budget": budget,
                "spent": spent,
                "remaining": remaining,
                "percentage": percentage,
                "period_start": period_start,
                "period_end": period_end,
                "category_name": category.name if category else None,
            })
        
        return statuses