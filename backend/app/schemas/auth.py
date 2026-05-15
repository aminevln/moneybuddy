"""
Schemi Pydantic per il flusso di password reset.

Gli schemi di login/register stanno in app/schemas/user.py (legacy).
"""

from pydantic import BaseModel, EmailStr, Field


class PasswordResetRequest(BaseModel):
    """Richiesta di reset: l'utente fornisce l'email."""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Conferma del reset con token + nuova password."""
    token: str = Field(min_length=20, max_length=255)
    new_password: str = Field(min_length=8, max_length=128)


class PasswordResetResponse(BaseModel):
    """Risposta generica (no information leak su esistenza email)."""
    message: str