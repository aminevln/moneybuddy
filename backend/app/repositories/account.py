"""
Repository per Account.
"""

from decimal import Decimal
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import AccountType
from app.models.user import Account
from app.schemas.account import AccountCreate, AccountUpdate


class AccountRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
    
    # ============================================================
    # READ
    # ============================================================
    
    async def list_for_user(self, user_id: UUID) -> list[Account]:
        """Tutti gli account dell'utente, ordinati per nome."""
        result = await self.db.execute(
            select(Account)
            .where(Account.user_id == user_id)
            .order_by(Account.name)
        )
        return list(result.scalars().all())
    
    async def get_by_id_for_user(
        self, account_id: UUID, user_id: UUID
    ) -> Account | None:
        """Recupera un account dell'utente."""
        result = await self.db.execute(
            select(Account).where(
                Account.id == account_id,
                Account.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()
    
    async def name_exists_for_user(
        self, name: str, user_id: UUID, exclude_id: UUID | None = None
    ) -> bool:
        """Verifica nome duplicato. exclude_id per il PATCH."""
        query = select(Account).where(
            Account.user_id == user_id,
            Account.name == name,
        )
        if exclude_id:
            query = query.where(Account.id != exclude_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None
    
    # ============================================================
    # AGGREGATES
    # ============================================================
    
    async def get_summary(self, user_id: UUID) -> dict:
        """
        Aggrega i balance per categoria.
        
        Ritorna un dict pronto per essere convertito in AccountsSummary.
        """
        # Una sola query con FILTER per ottenere tutti gli aggregati
        result = await self.db.execute(
            select(
                func.coalesce(
                    func.sum(Account.current_balance).filter(
                        Account.is_spendable.is_(True),
                        Account.type != AccountType.MEAL_VOUCHER,
                        Account.type != AccountType.INVESTMENT,
                    ),
                    0,
                ).label("total_spendable"),
                func.coalesce(
                    func.sum(Account.current_balance).filter(
                        Account.type == AccountType.MEAL_VOUCHER,
                    ),
                    0,
                ).label("total_meal_vouchers"),
                func.coalesce(
                    func.sum(Account.current_balance).filter(
                        Account.type == AccountType.INVESTMENT,
                    ),
                    0,
                ).label("total_investments"),
                func.coalesce(func.sum(Account.current_balance), 0).label("total_all"),
                func.count(Account.id).label("accounts_count"),
            )
            .where(Account.user_id == user_id)
        )
        row = result.one()
        return {
            "total_spendable": Decimal(str(row.total_spendable)),
            "total_meal_vouchers": Decimal(str(row.total_meal_vouchers)),
            "total_investments": Decimal(str(row.total_investments)),
            "total_all": Decimal(str(row.total_all)),
            "accounts_count": row.accounts_count,
        }
    
    # ============================================================
    # WRITE
    # ============================================================
    
    async def create(self, payload: AccountCreate, user_id: UUID) -> Account:
        """
        Crea un account.
        
        L'`initial_balance` viene salvato come `current_balance` iniziale.
        Le transazioni future lo modificheranno via trigger.
        """
        account = Account(
            user_id=user_id,
            name=payload.name,
            type=payload.type,
            current_balance=payload.initial_balance,
            is_spendable=payload.is_spendable,
        )
        self.db.add(account)
        await self.db.flush()
        await self.db.refresh(account)
        return account
    
    async def update(self, account: Account, payload: AccountUpdate) -> Account:
        """PATCH dei campi forniti."""
        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(account, key, value)
        await self.db.flush()
        await self.db.refresh(account)
        return account
    
    async def delete(self, account: Account) -> None:
        """
        Elimina un account.
        
        TODO: in 3.C aggiungeremo un check "ha transazioni? → blocca delete".
        Per ora i transazioni non esistono ancora.
        """
        await self.db.delete(account)
        await self.db.flush()