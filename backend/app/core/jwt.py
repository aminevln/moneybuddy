"""
Gestione JWT: creazione e verifica di access e refresh token.

Convenzioni:
- `sub` (subject) → user_id (UUID come stringa)
- `type` → "access" oppure "refresh" (per non confonderli)
- `exp` → scadenza (timestamp Unix). python-jose la valida automaticamente
- `iat` → issued at (quando è stato creato)
"""

from datetime import UTC, datetime, timedelta
from enum import Enum
from typing import Any
from uuid import UUID

from jose import JWTError, jwt

from app.config import settings


class TokenType(str, Enum):
    """Tipo di token, salvato nel claim `type`."""
    ACCESS = "access"
    REFRESH = "refresh"


class TokenError(Exception):
    """Sollevata quando un token è invalido, scaduto, o di tipo sbagliato."""
    pass


# ============================================================
# CREATE
# ============================================================

def _create_token(
    user_id: UUID,
    token_type: TokenType,
    expires_delta: timedelta,
) -> str:
    """Funzione interna: crea un token con i claims standard."""
    now = datetime.now(UTC)
    expires = now + expires_delta
    
    payload: dict[str, Any] = {
        "sub": str(user_id),         # user_id come stringa
        "type": token_type.value,    # "access" o "refresh"
        "iat": int(now.timestamp()),
        "exp": int(expires.timestamp()),
    }
    
    return jwt.encode(
        payload,
        settings.secret_key,
        algorithm=settings.jwt_algorithm,
    )


def create_access_token(user_id: UUID) -> str:
    """
    Crea un access token a vita breve (15 min default).
    
    Usato per ogni richiesta API.
    """
    return _create_token(
        user_id=user_id,
        token_type=TokenType.ACCESS,
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )


def create_refresh_token(user_id: UUID) -> str:
    """
    Crea un refresh token a vita lunga (30 giorni default).
    
    Usato solo per /auth/refresh per ottenere nuovi access token.
    """
    return _create_token(
        user_id=user_id,
        token_type=TokenType.REFRESH,
        expires_delta=timedelta(days=settings.refresh_token_expire_days),
    )


# ============================================================
# DECODE & VERIFY
# ============================================================

def decode_token(token: str, expected_type: TokenType) -> UUID:
    """
    Verifica e decodifica un token. Restituisce il `user_id`.
    
    Solleva TokenError se:
    - Firma invalida (qualcuno ha tentato di forgiare il token)
    - Token scaduto (exp passato)
    - Tipo sbagliato (es. passato un refresh dove serve un access)
    - Payload malformato (manca `sub`, ecc.)
    """
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError as e:
        raise TokenError(f"Token invalido: {e}") from e
    
    # Verifica che il tipo sia quello atteso
    token_type = payload.get("type")
    if token_type != expected_type.value:
        raise TokenError(
            f"Token type mismatch: atteso {expected_type.value}, ricevuto {token_type}"
        )
    
    # Estrai user_id
    sub = payload.get("sub")
    if not sub:
        raise TokenError("Token senza subject")
    
    try:
        return UUID(sub)
    except ValueError as e:
        raise TokenError(f"Subject non è un UUID: {sub}") from e