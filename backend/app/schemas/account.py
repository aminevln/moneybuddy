"""
Schemi Pydantic per Account.
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AccountType


# ============================================================
# INPUT SCHEMAS
# ============================================================

class AccountCreate(BaseModel):
    """Payload di creazione account."""
    
    name: str = Field(min_length=1, max_length=100)
    type: AccountType
    # initial_balance: per setup iniziale, l'utente dice "ho 1234€ sul conto"
    # Verrà salvato direttamente come current_balance.
    initial_balance: Decimal = Field(default=Decimal("0"), ge=0)
    is_spendable: bool = True


class AccountUpdate(BaseModel):
    """Payload PATCH. Tutti opzionali."""
    name: str | None = Field(default=None, min_length=1, max_length=100)
    is_spendable: bool | None = None
    # Nota: NON permettiamo di cambiare `type` né `current_balance`.
    # Per correggere il balance, l'utente dovrà fare una transazione di rettifica.


# ============================================================
# OUTPUT SCHEMAS
# ============================================================

class AccountResponse(BaseModel):
    """Rappresentazione "pubblica" di un account."""
    
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    name: str
    type: AccountType
    current_balance: Decimal
    is_spendable: bool
    created_at: datetime


class AccountsSummary(BaseModel):
    """
    Sommario aggregato di tutti gli account dell'utente.
    
    Usato per il widget "Totale spendibile" sulla home.
    """
    
    total_spendable: Decimal       # somma dei conti dove is_spendable=True
    total_meal_vouchers: Decimal   # buoni pasto (separati, non spendibili per tutto)
    total_investments: Decimal     # investimenti illiquidi
    total_all: Decimal             # somma di tutto (per visualizzazione "patrimonio")
    accounts_count: int