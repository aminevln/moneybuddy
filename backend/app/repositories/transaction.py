"""
Repository per Transaction.

Per ora solo CRUD base. Nel prossimo step aggiungeremo filtri, paginazione,
e un endpoint di "void" (soft delete) che è la vera azione di "cancellazione".
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import TxnDirection, TxnStatus
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate


class TransactionRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
    
    # ============================================================
    # READ
    # ============================================================
    
    async def get_by_id_for_user(
        self, txn_id: UUID, user_id: UUID
    ) -> Transaction | None:
        """Recupera una transazione dell'utente (anche se voided)."""
        result = await self.db.execute(
            select(Transaction).where(
                Transaction.id == txn_id,
                Transaction.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()
    
    async def list_for_user(
        self,
        user_id: UUID,
        *,
        page: int = 1,
        page_size: int = 50,
        include_voided: bool = False,
        account_id: UUID | None = None,
        category_id: UUID | None = None,
        direction: TxnDirection | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> tuple[list[Transaction], int]:
        """
        Lista paginata con filtri opzionali.
        
        Restituisce (items, total_count).
        - items = solo la pagina richiesta
        - total = totale dei match (per UI "1-50 di 234")
        """
        # Costruzione query base
        query = select(Transaction).where(Transaction.user_id == user_id)
        
        # Filtri
        if not include_voided:
            query = query.where(Transaction.voided_at.is_(None))
        if account_id is not None:
            query = query.where(Transaction.account_id == account_id)
        if category_id is not None:
            query = query.where(Transaction.category_id == category_id)
        if direction is not None:
            query = query.where(Transaction.direction == direction)
        if date_from is not None:
            query = query.where(Transaction.occurred_at >= date_from)
        if date_to is not None:
            query = query.where(Transaction.occurred_at <= date_to)
        
        # Count totale (per la paginazione UI)
        # Stessa query ma con count(*) invece di SELECT *
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()
        
        # Pagina richiesta, ordinata per data DESC
        offset = (page - 1) * page_size
        page_query = (
            query
            .order_by(Transaction.occurred_at.desc(), Transaction.recorded_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        result = await self.db.execute(page_query)
        items = list(result.scalars().all())
        
        return items, total
    
    # ============================================================
    # WRITE
    # ============================================================
    
    async def create(
        self, payload: TransactionCreate, user_id: UUID
    ) -> Transaction:
        """Crea una transazione. Il balance dell'account viene aggiornato dal trigger DB."""
        txn = Transaction(
            user_id=user_id,
            account_id=payload.account_id,
            category_id=payload.category_id,
            direction=payload.direction,
            status=payload.status,
            amount=payload.amount,
            description=payload.description,
            merchant=payload.merchant,
            occurred_at=payload.occurred_at,
            txn_metadata=payload.metadata,
        )
        self.db.add(txn)
        await self.db.flush()
        await self.db.refresh(txn)
        return txn
    
    async def update(
        self, txn: Transaction, payload: TransactionUpdate
    ) -> Transaction:
        """
        Aggiorna campi modificabili.
        
        NON tocchiamo amount/direction/account/status: per quelli bisogna
        VOIDARE e ricreare. È la disciplina dell'append-only ledger.
        """
        update_data = payload.model_dump(exclude_unset=True)
        # Rinomina `metadata` → `txn_metadata` se presente
        if "metadata" in update_data:
            update_data["txn_metadata"] = update_data.pop("metadata")
        
        for key, value in update_data.items():
            setattr(txn, key, value)
        
        await self.db.flush()
        await self.db.refresh(txn)
        return txn
    
    async def void(self, txn: Transaction) -> Transaction:
        """
        Soft delete: marca come voided invece di cancellare.
        
        IMPORTANTE: il trigger DB del balance funziona solo per le transazioni
        cleared. Quando "voidiamo" una transazione, il balance dovrebbe
        riflettere la modifica. Per ora il trigger non gestisce il void
        (lo aggiungeremo se serve). Strategia alternativa più semplice:
        l'utente crea una "controtransazione" di rettifica.
        
        Per la Fase 1 questo è OK: void = "questa non vale, non considerarla".
        Quando l'AI calcolerà i balance, filtrerà voided_at IS NULL.
        """
        from datetime import UTC
        txn.voided_at = datetime.now(UTC)
        txn.status = TxnStatus.VOIDED
        await self.db.flush()
        await self.db.refresh(txn)
        return txn