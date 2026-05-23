"""
Schemi Pydantic per RecurringTransaction.

Una RecurringTransaction è un "template" di spesa o entrata che si ripete
con una certa frequenza (settimanale, mensile, ecc.). Esempi:
- Stipendio mensile il 27
- Affitto mensile il 1
- Benzina settimanale (~70€)
- Sigarette ogni 4 giorni (~35€)

L'AI usa queste informazioni per fare forecast di cash flow:
"posso permettermi 200€ in più questa settimana?" tiene conto delle
ricorrenze in arrivo.
"""

from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import RecurrenceFreq, TxnDirection


# ============================================================
# INPUT SCHEMAS
# ============================================================

class RecurringTransactionCreate(BaseModel):
    """Payload di creazione di una transazione ricorrente."""
    
    account_id: UUID
    category_id: Optional[UUID] = None
    direction: TxnDirection
    frequency: RecurrenceFreq
    amount: Decimal = Field(gt=0, description="Importo positivo, segno deciso da direction")
    description: str = Field(min_length=1, max_length=200)
    # day_of_month è significativo solo per MONTHLY/YEARLY (es. "il 27 di ogni mese")
    day_of_month: Optional[int] = Field(default=None, ge=1, le=31)
    next_occurrence: date
    end_date: Optional[date] = None
    is_active: bool = True
    
    @field_validator("end_date")
    @classmethod
    def end_date_after_next_occurrence(cls, v: Optional[date], info) -> Optional[date]:
        """Se end_date è specificata, deve essere ≥ next_occurrence."""
        if v is not None:
            next_occ = info.data.get("next_occurrence")
            if next_occ and v < next_occ:
                raise ValueError("end_date deve essere >= next_occurrence")
        return v


class RecurringTransactionUpdate(BaseModel):
    """Payload PATCH. Tutti opzionali — l'utente cambia solo ciò che vuole."""
    
    account_id: Optional[UUID] = None
    category_id: Optional[UUID] = None
    direction: Optional[TxnDirection] = None
    frequency: Optional[RecurrenceFreq] = None
    amount: Optional[Decimal] = Field(default=None, gt=0)
    description: Optional[str] = Field(default=None, min_length=1, max_length=200)
    day_of_month: Optional[int] = Field(default=None, ge=1, le=31)
    next_occurrence: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None


# ============================================================
# OUTPUT SCHEMAS
# ============================================================

class RecurringTransactionResponse(BaseModel):
    """Rappresentazione "pubblica" di una transazione ricorrente."""
    
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    account_id: UUID
    category_id: Optional[UUID]
    direction: TxnDirection
    frequency: RecurrenceFreq
    amount: Decimal
    description: str
    day_of_month: Optional[int]
    next_occurrence: date
    end_date: Optional[date]
    is_active: bool