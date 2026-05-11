"""
Endpoint di autenticazione.

Per ora abbiamo:
- POST /auth/register → crea un nuovo utente
- POST /auth/login    → verifica credenziali

I JWT (token) li aggiungiamo nel Blocco 2.C.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_password
from app.db.session import get_db
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate, UserLogin, UserResponse


# Tutti gli endpoint qui dentro saranno prefissati con /auth
# e raggruppati sotto il tag "Auth" nella documentazione /docs
router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registra un nuovo utente",
)
async def register(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """
    Crea un nuovo utente.
    
    Validazioni:
    - email deve essere valida (Pydantic)
    - password tra 8 e 128 caratteri (Pydantic)
    - email non deve essere già registrata
    """
    repo = UserRepository(db)
    
    # Controlla che l'email sia libera
    if await repo.email_exists(payload.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email già registrata",
        )
    
    # Crea l'utente
    user = await repo.create(payload)
    await db.commit()
    
    return UserResponse.model_validate(user)


@router.post(
    "/login",
    response_model=UserResponse,
    summary="Login (placeholder, restituirà JWT in 2.C)",
)
async def login(
    payload: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """
    Verifica le credenziali dell'utente.
    
    Per ora restituisce solo i dati dell'utente. In 2.C aggiungeremo
    la generazione di access token + refresh token.
    
    Errori:
    - 401 se email non esiste OPPURE password sbagliata
      (stesso messaggio per entrambi → non rivelare quali email
       sono registrate, è una protezione contro user enumeration)
    """
    repo = UserRepository(db)
    user = await repo.get_by_email(payload.email)
    
    # Usiamo lo stesso errore per "email inesistente" e "password sbagliata"
    # per evitare di rivelare quali email sono registrate nel sistema.
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenziali non valide",
        )
    
    return UserResponse.model_validate(user)