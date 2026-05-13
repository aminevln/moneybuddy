"""
Helper per calcolo di intervalli temporali (periodi di budget).

Date semantics:
- "weekly": dal lunedì alla domenica della settimana corrente
- "monthly": dal 1° all'ultimo del mese corrente
- "yearly": dal 1° gennaio al 31 dicembre dell'anno corrente
"""

from calendar import monthrange
from datetime import date, timedelta

from app.models.enums import BudgetPeriod


def current_period_bounds(period: BudgetPeriod, today: date | None = None) -> tuple[date, date]:
    """
    Restituisce (inizio_periodo, fine_periodo) per il periodo corrente.
    
    today è iniettabile per testabilità.
    """
    if today is None:
        today = date.today()
    
    if period == BudgetPeriod.WEEKLY:
        # weekday(): lunedì=0, domenica=6
        start = today - timedelta(days=today.weekday())
        end = start + timedelta(days=6)
        return start, end
    
    if period == BudgetPeriod.MONTHLY:
        start = today.replace(day=1)
        _, last_day = monthrange(today.year, today.month)
        end = today.replace(day=last_day)
        return start, end
    
    if period == BudgetPeriod.YEARLY:
        start = date(today.year, 1, 1)
        end = date(today.year, 12, 31)
        return start, end
    
    raise ValueError(f"Periodo non supportato: {period}")