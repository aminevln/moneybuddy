"""
Service layer per Transaction.

Responsabilità:
- Validare che account_id e category_id appartengano all'utente
- Orchestrare repository (transaction + account + category)
- Convertire validazioni di business in HTTPException

Pattern: il router chiama il service, il service chiama i repository.
Il service è il livello "logica di business".
"""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction
from app.models.user import User
from app.repositories.account import AccountRepository
from app.repositories.category import CategoryRepository
from app.repositories.transaction import TransactionRepository
from app.schemas.transaction import TransactionCreate, TransactionUpdate


class TransactionService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.txn_repo = TransactionRepository(db)
        self.account_repo = AccountRepository(db)
        self.category_repo = CategoryRepository(db)
    
    # ============================================================
    # VALIDATIONS
    # ============================================================
    
    async def _validate_account_for_user(self, account_id: UUID, user_id: UUID) -> None:
        """L'account deve esistere ed essere dell'utente."""
        account = await self.account_repo.get_by_id_for_user(account_id, user_id)
        if account is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account non trovato o non tuo",
            )
    
    async def _validate_category_for_user(
        self, category_id: UUID, user_id: UUID
    ) -> None:
        """La categoria deve esistere ed essere visibile all'utente (sistema o sua)."""
        category = await self.category_repo.get_by_id_for_user(category_id, user_id)
        if category is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Categoria non trovata",
            )
    
    # ============================================================
    # CREATE
    # ============================================================
    
    async def create_transaction(
        self, payload: TransactionCreate, user: User
    ) -> Transaction:
        """Crea una transazione, dopo aver validato gli FK."""
        # Validazioni cross-entity
        await self._validate_account_for_user(payload.account_id, user.id)
        if payload.category_id:
            await self._validate_category_for_user(payload.category_id, user.id)
        
        txn = await self.txn_repo.create(payload, user.id)
        return txn
    
    # ============================================================
    # UPDATE
    # ============================================================
    
    async def update_transaction(
        self, txn_id: UUID, payload: TransactionUpdate, user: User
    ) -> Transaction:
        """Aggiorna una transazione esistente."""
        txn = await self.txn_repo.get_by_id_for_user(txn_id, user.id)
        if txn is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transazione non trovata",
            )
        
        if txn.voided_at is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Non puoi modificare una transazione annullata",
            )
        
        # Se cambia category_id, valida
        if payload.category_id is not None:
            await self._validate_category_for_user(payload.category_id, user.id)
        
        return await self.txn_repo.update(txn, payload)
    
    # ============================================================
    # VOID
    # ============================================================
    
    async def void_transaction(self, txn_id: UUID, user: User) -> Transaction:
        """Annulla una transazione (soft delete)."""
        txn = await self.txn_repo.get_by_id_for_user(txn_id, user.id)
        if txn is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transazione non trovata",
            )
        
        if txn.voided_at is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transazione già annullata",
            )
        
        return await self.txn_repo.void(txn)