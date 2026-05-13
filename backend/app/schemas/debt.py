"""
Schemi Pydantic per Debt.
"""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DebtCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    creditor: str | None = Field(default=None, max_length=100)
    
    initial_amount: Decimal = Field(gt=0)         # importo iniziale del debito
    current_balance: Decimal = Field(ge=0)        # residuo attuale
    monthly_payment: Decimal | None = Field(default=None, ge=0)
    interest_rate: Decimal | None = Field(default=None, ge=0, le=100)  # %
    
    start_date: date | None = None
    end_date: date | None = None
    
    notes: str | None = Field(default=None, max_length=500)


class DebtUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    creditor: str | None = Field(default=None, max_length=100)
    current_balance: Decimal | None = Field(default=None, ge=0)
    monthly_payment: Decimal | None = Field(default=None, ge=0)
    interest_rate: Decimal | None = Field(default=None, ge=0, le=100)
    end_date: date | None = None
    notes: str | None = Field(default=None, max_length=500)
    # Note: NON permettiamo di cambiare initial_amount né start_date
    # (sono "verità storiche" del debito)


class DebtResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    name: str
    creditor: str | None
    initial_amount: Decimal
    current_balance: Decimal
    monthly_payment: Decimal | None
    interest_rate: Decimal | None
    start_date: date | None
    end_date: date | None
    notes: str | None
    created_at: datetime