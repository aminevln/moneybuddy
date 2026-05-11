"""
Enumerazioni usate nei modelli.

Sono mappate a tipi ENUM PostgreSQL nativi (più efficienti e
più tipo-safety di CHECK constraints con varchar).
"""

import enum


class AccountType(str, enum.Enum):
    CHECKING = "checking"
    SAVINGS = "savings"
    CASH = "cash"
    MEAL_VOUCHER = "meal_voucher"
    CREDIT_CARD = "credit_card"
    INVESTMENT = "investment"


class TxnDirection(str, enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"


class TxnStatus(str, enum.Enum):
    PLANNED = "planned"
    PENDING = "pending"
    CLEARED = "cleared"
    VOIDED = "voided"


class RecurrenceFreq(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


class BudgetPeriod(str, enum.Enum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    TOOL = "tool"


class MemoryKind(str, enum.Enum):
    FACT = "fact"
    PREFERENCE = "preference"
    EVENT = "event"
    PLAN = "plan"
    SUMMARY = "summary"
    REFLECTION = "reflection"