"""
Repository per Debt.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.debt import Debt
from app.schemas.debt import DebtCreate, DebtUpdate


class DebtRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
    
    async def list_for_user(self, user_id: UUID) -> list[Debt]:
        result = await self.db.execute(
            select(Debt)
            .where(Debt.user_id == user_id)
            .order_by(Debt.created_at.desc())  # più recenti prima
        )
        return list(result.scalars().all())
    
    async def get_by_id_for_user(
        self, debt_id: UUID, user_id: UUID
    ) -> Debt | None:
        result = await self.db.execute(
            select(Debt).where(
                Debt.id == debt_id,
                Debt.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()
    
    async def create(self, payload: DebtCreate, user_id: UUID) -> Debt:
        debt = Debt(
            user_id=user_id,
            name=payload.name,
            creditor=payload.creditor,
            initial_amount=payload.initial_amount,
            current_balance=payload.current_balance,
            monthly_payment=payload.monthly_payment,
            interest_rate=payload.interest_rate,
            start_date=payload.start_date,
            end_date=payload.end_date,
            notes=payload.notes,
        )
        self.db.add(debt)
        await self.db.flush()
        await self.db.refresh(debt)
        return debt
    
    async def update(self, debt: Debt, payload: DebtUpdate) -> Debt:
        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(debt, key, value)
        await self.db.flush()
        await self.db.refresh(debt)
        return debt
    
    async def delete(self, debt: Debt) -> None:
        await self.db.delete(debt)
        await self.db.flush()