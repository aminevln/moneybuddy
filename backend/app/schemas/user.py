"""
Schemi Pydantic per User.

Distinguiamo nettamente:
- Modelli SQLAlchemy (app/models/) → mappano tabelle DB
- Schemi Pydantic (app/schemas/) → validano input/output API

Convenzione naming:
- *Create   → payload di creazione (input)
- *Login    → payload di login (input)
- *Response → dato restituito dall'API (output, senza campi sensibili)
- *InDB     → rappresentazione completa interna (uso solo nel backend)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ============================================================
# INPUT SCHEMAS
# ============================================================

class UserCreate(BaseModel):
    """
    Payload di registrazione.
    
    Pydantic valida automaticamente:
    - email è una email valida (EmailStr fa il check)
    - password ha lunghezza min/max (Field constraints)
    - display_name non è vuoto
    """
    
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=100)


class UserLogin(BaseModel):
    """Payload di login."""
    
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


# ============================================================
# OUTPUT SCHEMAS
# ============================================================

class UserResponse(BaseModel):
    """
    Rappresentazione "pubblica" di un User restituita dall'API.
    
    NOTA BENE: NON include `password_hash`. Mai.
    Ogni volta che restituiamo un User al client, usiamo questo schema.
    """
    
    # ConfigDict(from_attributes=True) → Pydantic accetta oggetti SQLAlchemy
    # (legge gli attributi via getattr, invece di dict[chiave])
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    email: EmailStr
    display_name: str
    timezone: str
    currency: str
    salary_day: int | None
    created_at: datetime