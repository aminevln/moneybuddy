"""
Repository per RecurringTransaction.

Operazioni CRUD sulle transazioni ricorrenti (stipendio, affitto,
benzina settimanale, abbonamenti, ecc).
"""

from datetime import date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import RecurringTransaction
from app.schemas.recurring_transaction import (
    RecurringTransactionCreate,
    RecurringTransactionUpdate,
)


class RecurringTransactionRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
    
    # ============================================================
    # READ
    # ============================================================
    
    async def list_for_user(
        self,
        user_id: UUID,
        *,
        only_active: bool = False,
    ) -> list[RecurringTransaction]:
        """
        Tutte le transazioni ricorrenti dell'utente, ordinate per
        prossima occorrenza (le più imminenti per prime).
        
        Se only_active=True, filtra solo quelle attive.
        """
        query = select(RecurringTransaction).where(
            RecurringTransaction.user_id == user_id
        )
        if only_active:
            query = query.where(RecurringTransaction.is_active.is_(True))
        query = query.order_by(RecurringTransaction.next_occurrence)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_by_id_for_user(
        self, recurring_id: UUID, user_id: UUID
    ) -> RecurringTransaction | None:
        """Recupera una ricorrente dell'utente (per dettaglio o edit)."""
        result = await self.db.execute(
            select(RecurringTransaction).where(
                RecurringTransaction.id == recurring_id,
                RecurringTransaction.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()
    
    async def list_active_until(
        self, user_id: UUID, until: date
    ) -> list[RecurringTransaction]:
        """
        Ricorrenti attive con next_occurrence <= `until`.
        
        Usata dal forecast: "quali ricorrenti scadono prima del 9 giugno?".
        Non gestisce ancora la moltiplicazione (es. una weekly si ripete
        più volte nel periodo) — quello sarà compito del service di forecast.
        """
        result = await self.db.execute(
            select(RecurringTransaction)
            .where(
                RecurringTransaction.user_id == user_id,
                RecurringTransaction.is_active.is_(True),
                RecurringTransaction.next_occurrence <= until,
            )
            .order_by(RecurringTransaction.next_occurrence)
        )
        return list(result.scalars().all())
    
    # ============================================================
    # WRITE
    # ============================================================
    
    async def create(
        self, payload: RecurringTransactionCreate, user_id: UUID
    ) -> RecurringTransaction:
        """Crea una nuova ricorrente."""
        recurring = RecurringTransaction(
            user_id=user_id,
            account_id=payload.account_id,
            category_id=payload.category_id,
            direction=payload.direction,
            frequency=payload.frequency,
            amount=payload.amount,
            description=payload.description,
            day_of_month=payload.day_of_month,
            next_occurrence=payload.next_occurrence,
            end_date=payload.end_date,
            is_active=payload.is_active,
        )
        self.db.add(recurring)
        await self.db.flush()
        await self.db.refresh(recurring)
        return recurring
    
    async def update(
        self,
        recurring: RecurringTransaction,
        payload: RecurringTransactionUpdate,
    ) -> RecurringTransaction:
        """PATCH dei campi forniti."""
        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(recurring, key, value)
        await self.db.flush()
        await self.db.refresh(recurring)
        return recurring
    
    async def delete(self, recurring: RecurringTransaction) -> None:
        """
        Elimina una ricorrente.
        
        Non genera transazioni a posteriori: cancellare significa
        "non considerare più nei forecast", non "annullare le passate".
        """
        await self.db.delete(recurring)
        await self.db.flush()