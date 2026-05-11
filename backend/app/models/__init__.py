"""
Pacchetto models.

Importa qui TUTTI i modelli così che Alembic li veda automaticamente
quando fa `from app.models import *` in env.py.
"""

from app.models.user import User, Account
from app.models.category import Category
from app.models.transaction import Transaction, RecurringTransaction
from app.models.budget import Budget
from app.models.debt import Debt
from app.models.asset import UserAsset
from app.models.chat import ChatSession, ChatMessage
from app.models.memory import MemoryChunk

__all__ = [
    "User",
    "Account",
    "Category",
    "Transaction",
    "RecurringTransaction",
    "Budget",
    "Debt",
    "UserAsset",
    "ChatSession",
    "ChatMessage",
    "MemoryChunk",
]