"""
Endpoint analytics per la dashboard.

GET /analytics/overview → blob unico con dati per la dashboard
"""

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.deps import get_current_user
from app.models.user import User
from app.repositories.analytics import AnalyticsRepository
from app.schemas.analytics import (
    AnalyticsOverview,
    CategoryBreakdown,
    MonthlyComparison,
)
from app.utils.periods import current_period_bounds
from app.models.enums import BudgetPeriod


router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "/overview",
    response_model=AnalyticsOverview,
    summary="Dati aggregati per la dashboard (BFF endpoint)",
)
async def get_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AnalyticsOverview:
    repo = AnalyticsRepository(db)
    
    monthly = await repo.get_monthly_comparison(current_user.id)
    breakdown = await repo.get_category_breakdown(current_user.id)
    
    cur_start, cur_end = current_period_bounds(BudgetPeriod.MONTHLY)
    
    return AnalyticsOverview(
        monthly_comparison=MonthlyComparison(**monthly),
        category_breakdown=[CategoryBreakdown(**b) for b in breakdown],
        period_start=cur_start,
        period_end=cur_end,
    )