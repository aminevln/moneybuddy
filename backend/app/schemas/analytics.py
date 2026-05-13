"""
Schemi per endpoint analytics.

Pattern BFF (Backend for Frontend): un solo endpoint /analytics/overview
restituisce tutto quello che serve alla dashboard, calcolato lato DB.
"""

from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class MonthlyComparison(BaseModel):
    """Confronto income/expense mese corrente vs precedente."""
    
    current_month_income: Decimal
    current_month_expense: Decimal
    previous_month_income: Decimal
    previous_month_expense: Decimal
    
    income_delta: Decimal           # current - previous (positivo = entrate aumentate)
    expense_delta: Decimal          # current - previous (positivo = spese aumentate)
    
    current_month_start: date
    current_month_end: date
    previous_month_start: date
    previous_month_end: date


class CategoryBreakdown(BaseModel):
    """Quanto è stato speso in una categoria nel mese corrente."""
    
    category_id: str | None        # None per spese senza categoria
    category_name: str             # "Senza categoria" per quelle senza
    category_color: str | None
    total_spent: Decimal
    transaction_count: int


class AnalyticsOverview(BaseModel):
    """Blob unico per la dashboard."""
    
    monthly_comparison: MonthlyComparison
    category_breakdown: list[CategoryBreakdown]   # ordinato per total_spent DESC
    period_start: date    # mese corrente, ridondante con monthly_comparison
    period_end: date