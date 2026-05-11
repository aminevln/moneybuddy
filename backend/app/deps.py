"""
Dependency injection di FastAPI condivise.

Mettiamo qui le dependency che vengono usate da più router,
per evitare di duplicarle o creare import circolari.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.jwt import TokenError, TokenType, decode_token
from app.db.session import get_db
from app.models.user import User
from app.repositories.user import UserRepository


# ============================================================
# OAuth2 SCHEME
# ============================================================
# OAuth2PasswordBearer legge l'header `Authorization: Bearer <token>`.
# - tokenUrl="/auth/login" → URL dove ottenere un token (usato solo
#   per la documentazione Swagger UI, non per il flusso reale)
# - auto_error=True → se l'header manca, restituisce 401 automaticamente
# ============================================================
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=True)


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Dependency per endpoint protetti.
    
    Estrae il token dall'header Authorization, verifica firma e
    scadenza, carica l'utente dal DB e lo restituisce.
    
    Solleva 401 se:
    - Token mancante (gestito da oauth2_scheme)
    - Token invalido, scaduto, o di tipo sbagliato
    - Utente referenziato dal token non esiste più
    
    Uso negli endpoint:
        @router.get("/protected")
        async def protected(current_user: User = Depends(get_current_user)):
            return {"hello": current_user.display_name}
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenziali non valide o token scaduto",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        user_id = decode_token(token, expected_type=TokenType.ACCESS)
    except TokenError:
        raise credentials_exception
    
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if user is None:
        raise credentials_exception
    
    return user