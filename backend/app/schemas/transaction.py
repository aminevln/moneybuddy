"""
Schemi Pydantic per Transaction.
"""

from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import TxnDirection, TxnStatus


# ============================================================
# INPUT SCHEMAS
# ============================================================

class TransactionCreate(BaseModel):
    """Payload di creazione transazione."""
    
    account_id: UUID
    category_id: UUID | None = None       # opzionale: si può lasciare senza categoria
    direction: TxnDirection                # income / expense / transfer
    amount: Decimal = Field(gt=0)          # sempre positivo (il segno lo dà direction)
    description: str = Field(min_length=1, max_length=255)
    merchant: str | None = Field(default=None, max_length=255)
    occurred_at: datetime                  # quando è avvenuta (può essere passato/futuro)
    metadata: dict[str, Any] = Field(default_factory=dict)
    # Status: per ora sempre 'cleared'. In futuro 'planned' per pianificate.
    status: TxnStatus = TxnStatus.CLEARED


class TransactionUpdate(BaseModel):
    """
    Payload PATCH.
    
    Note di design:
    - NON permettiamo di cambiare account_id (rovinerebbe i balance storici)
    - NON permettiamo di cambiare amount/direction/status (idem)
    - SOLO description, merchant, category_id, metadata, occurred_at sono modificabili
    
    Per correggere amount/direction, l'utente deve VOIDARE e ricreare.
    Questa è la semantica corretta di un append-only ledger.
    """
    
    description: str | None = Field(default=None, min_length=1, max_length=255)
    merchant: str | None = Field(default=None, max_length=255)
    category_id: UUID | None = None
    occurred_at: datetime | None = None
    metadata: dict[str, Any] | None = None


# ============================================================
# OUTPUT SCHEMAS
# ============================================================

class TransactionResponse(BaseModel):
    """Rappresentazione "pubblica" di una transazione."""
    
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    account_id: UUID
    category_id: UUID | None
    direction: TxnDirection
    status: TxnStatus
    amount: Decimal
    description: str
    merchant: str | None
    occurred_at: datetime
    recorded_at: datetime
    voided_at: datetime | None
    
    # Pydantic non ha rinominato il campo Python (`txn_metadata`)
    # ma noi vogliamo esporlo come "metadata" all'API
    metadata: dict[str, Any] = Field(
        validation_alias="txn_metadata",
        serialization_alias="metadata",
    )


class TransactionListResponse(BaseModel):
    """
    Risposta paginata della lista transazioni.
    
    Pattern cursor-less: page + size + total.
    Più semplice di cursor pagination, ma OK per il nostro use case.
    """
    
    items: list[TransactionResponse]
    total: int            # totale risultati (per il count "X transazioni")
    page: int             # pagina corrente (1-indexed)
    page_size: int        # dimensione pagina
    has_more: bool        # ci sono altre pagine?