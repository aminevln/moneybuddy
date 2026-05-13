"""
Schemi Pydantic per Debt.

Note sui campi:
- creditor è obbligatorio (es. "Banca Intesa", "Famiglia", "Findomestic")
- interest_rate è espresso come DECIMALE (es. 0.025 per 2.5%), non percentuale
- due_date è la scadenza del debito (quando si finisce di pagare)
"""

from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DebtCreate(BaseModel):
    creditor: str = Field(min_length=1, max_length=200)
    original_amount: Decimal = Field(gt=0)
    remaining_amount: Decimal = Field(ge=0)
    interest_rate: Decimal | None = Field(
        default=None,
        ge=0,
        le=Decimal("9.9999"),
        description="Decimale, es. 0.025 per 2.5%",
    )
    monthly_payment: Decimal | None = Field(default=None, ge=0)
    due_date: date | None = None
    notes: str | None = Field(default=None, max_length=1000)


class DebtUpdate(BaseModel):
    creditor: str | None = Field(default=None, min_length=1, max_length=200)
    remaining_amount: Decimal | None = Field(default=None, ge=0)
    interest_rate: Decimal | None = Field(
        default=None, ge=0, le=Decimal("9.9999")
    )
    monthly_payment: Decimal | None = Field(default=None, ge=0)
    due_date: date | None = None
    notes: str | None = Field(default=None, max_length=1000)
    # Note: NON permettiamo di modificare original_amount (è una "verità storica")


class DebtResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    creditor: str
    original_amount: Decimal
    remaining_amount: Decimal
    interest_rate: Decimal | None
    monthly_payment: Decimal | None
    due_date: date | None
    notes: str | None