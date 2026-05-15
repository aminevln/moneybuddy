"""
Builder per il context da passare a Gemini.

Recupera dal DB:
- Profilo utente
- Summary accounts
- Budget attivi con status
- Ultime N transazioni
- Memorie rilevanti via RAG (se gemini disponibile)
"""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.client import GeminiClient
from app.models.user import User
from app.repositories.account import AccountRepository
from app.repositories.budget import BudgetRepository
from app.repositories.transaction import TransactionRepository
from app.services.memory import MemoryService


async def build_chat_context(
    db: AsyncSession,
    gemini: GeminiClient,
    user: User,
    query_text: str,
) -> dict:
    """
    Costruisce un dict context completo per il prompt.
    
    query_text è l'ultimo messaggio utente, usato per RAG search delle memorie.
    """
    
    # Accounts summary
    account_repo = AccountRepository(db)
    accounts_summary = await account_repo.get_summary(user.id)
    # Convert Decimal in str per JSON serialization safety
    accounts_summary_serializable = {
        k: str(v) if hasattr(v, "is_finite") else v
        for k, v in accounts_summary.items()
    }

    # Lista esplicita degli account con UUID (servono all'AI per propose_transaction)
    accounts = await account_repo.list_for_user(user.id)
    accounts_list = [
        {
            "id": str(a.id),
            "name": a.name,
            "type": a.type.value,
            "is_spendable": a.is_spendable,
            "current_balance": str(a.current_balance),
        }
        for a in accounts
    ]
    
    # Budget attivi
    budget_repo = BudgetRepository(db)
    budget_statuses = await budget_repo.list_with_status(user.id, only_active=True)
    active_budgets_serializable = [
        {
            "budget": {
                "period": s["budget"].period.value,
                "amount_limit": str(s["budget"].amount_limit),
            },
            "spent": str(s["spent"]),
            "percentage": str(s["percentage"]),
            "category_name": s["category_name"],
        }
        for s in budget_statuses
    ]
    
    # Ultime 10 transazioni
    txn_repo = TransactionRepository(db)
    txns, _ = await txn_repo.list_for_user(
        user.id,
        page=1,
        page_size=10,
        include_voided=False,
    )
    
    # Per il nome della categoria, facciamo un mini fetch
    # (potremmo ottimizzare con JOIN, ma 10 è poco)
    from app.repositories.category import CategoryRepository
    cat_repo = CategoryRepository(db)
    categories = await cat_repo.list_for_user(user.id)
    cat_map = {c.id: c.name for c in categories}
    categories_list = [
        {
            "id": str(c.id),
            "name": c.name,
        }
        for c in categories
    ]
    
    recent_transactions = [
        {
            "occurred_at": t.occurred_at.isoformat(),
            "amount": str(t.amount),
            "direction": t.direction.value,
            "description": t.description,
            "category_name": cat_map.get(t.category_id) if t.category_id else None,
        }
        for t in txns
    ]
    
    # Memorie rilevanti via RAG
    memory_service = MemoryService(db, gemini)
    try:
        memory_results = await memory_service.search_similar(
            user_id=user.id,
            query=query_text,
            limit=5,
            min_importance=3,
        )
        relevant_memories = [chunk.content for chunk, _ in memory_results]
    except Exception:
        # Se Gemini fallisce il search, andiamo avanti senza memorie
        relevant_memories = []
    
    return {
        "display_name": user.display_name,
        "currency": user.currency,
        "accounts_summary": accounts_summary_serializable,
        "accounts_list": accounts_list,
        "categories_list": categories_list,
        "active_budgets": active_budgets_serializable,
        "recent_transactions": recent_transactions,
        "relevant_memories": relevant_memories,
    }