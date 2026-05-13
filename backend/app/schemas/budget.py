"""
Schemi Pydantic per Budget.
"""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import BudgetPeriod


# ============================================================
# INPUT
# ============================================================

class BudgetCreate(BaseModel):
    """
    Payload di creazione budget.
    
    - category_id None = budget "globale" (somma tutte le expense del periodo)
    - period: weekly / monthly / yearly
    - amount_limit > 0
    - starts_on default = oggi
    """
    
    category_id: UUID | None = None
    period: BudgetPeriod
    amount_limit: Decimal = Field(gt=0)
    starts_on: date | None = None    # default: oggi (impostato lato repo)
    ends_on: date | None = None
    is_active: bool = True


class BudgetUpdate(BaseModel):
    """
    Payload PATCH.
    
    NON permettiamo di cambiare period (cambierebbe la semantica del calcolo).
    NON permettiamo di cambiare starts_on (è storico).
    """
    
    category_id: UUID | None = None
    amount_limit: Decimal | None = Field(default=None, gt=0)
    ends_on: date | None = None
    is_active: bool | None = None


# ============================================================
# OUTPUT
# ============================================================

class BudgetResponse(BaseModel):
    """Rappresentazione semplice di un budget."""
    
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    category_id: UUID | None
    period: BudgetPeriod
    amount_limit: Decimal
    starts_on: date
    ends_on: date | None
    is_active: bool


class BudgetStatus(BaseModel):
    """
    Budget arricchito con i dati calcolati al volo:
    - spent: quanto speso nel periodo corrente
    - remaining: amount_limit - spent
    - percentage: spent / amount_limit * 100 (utile per progress bar)
    - period_start, period_end: inizio/fine del periodo corrente
    - category_name: il nome della categoria (None se budget globale)
    """
    
    budget: BudgetResponse
    spent: Decimal
    remaining: Decimal
    percentage: Decimal             # 0-100+ (può superare 100 = budget sforato)
    period_start: date
    period_end: date
    category_name: str | None