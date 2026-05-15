"""
Endpoint di autenticazione.

- POST /auth/register → crea un utente + restituisce token (auto-login)
- POST /auth/login    → verifica credenziali + restituisce token
- POST /auth/refresh  → rinnova access token usando refresh token
- GET  /auth/me       → restituisce l'utente corrente (richiede token)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.jwt import (
    TokenError,
    TokenType,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.security import verify_password
from app.db.session import get_db
from app.deps import get_current_user
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import (
    LoginResponse,
    RegisterResponse,
    TokenPair,
    TokenRefresh,
    UserCreate,
    UserLogin,
    UserResponse,
)

from app.schemas.auth import (
    PasswordResetConfirm,
    PasswordResetRequest,
    PasswordResetResponse,
)
from app.services.password_reset import PasswordResetService


router = APIRouter(prefix="/auth", tags=["Auth"])


def _build_token_pair(user: User) -> TokenPair:
    """Helper: genera access + refresh per un utente."""
    return TokenPair(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


# ============================================================
# REGISTER
# ============================================================

@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registra un nuovo utente (e fa auto-login)",
)
async def register(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> RegisterResponse:
    repo = UserRepository(db)
    
    if await repo.email_exists(payload.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email già registrata",
        )
    
    user = await repo.create(payload)
    await db.commit()
    
    return RegisterResponse(
        user=UserResponse.model_validate(user),
        tokens=_build_token_pair(user),
    )


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Login con email e password",
)
async def login(
    payload: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    repo = UserRepository(db)
    user = await repo.get_by_email(payload.email)
    
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenziali non valide",
        )
    
    return LoginResponse(
        user=UserResponse.model_validate(user),
        tokens=_build_token_pair(user),
    )

# ============================================================
# PASSWORD RESET
# ============================================================

@router.post(
    "/password-reset/request",
    response_model=PasswordResetResponse,
    summary="Richiedi un reset password (genera token, invia email in prod)",
)
async def request_password_reset(
    payload: PasswordResetRequest,
    db: AsyncSession = Depends(get_db),
) -> PasswordResetResponse:
    service = PasswordResetService(db)
    await service.request_reset(payload.email)
    await db.commit()
    
    # Anti-enumeration: stesso messaggio per email esistente e non
    return PasswordResetResponse(
        message=(
            "Se l'email è registrata, riceverai a breve un link per il reset. "
            "Controlla anche la cartella spam."
        )
    )


@router.post(
    "/password-reset/confirm",
    response_model=PasswordResetResponse,
    summary="Conferma reset password con token + nuova password",
)
async def confirm_password_reset(
    payload: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db),
) -> PasswordResetResponse:
    service = PasswordResetService(db)
    try:
        await service.confirm_reset(payload.token, payload.new_password)
        await db.commit()
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )
    
    return PasswordResetResponse(
        message="Password aggiornata con successo. Puoi accedere con la nuova password."
    )

# ============================================================
# REFRESH
# ============================================================

@router.post(
    "/refresh",
    response_model=TokenPair,
    summary="Rinnova access token usando refresh token",
)
async def refresh(
    payload: TokenRefresh,
    db: AsyncSession = Depends(get_db),
) -> TokenPair:
    """
    Verifica il refresh token e restituisce una nuova coppia di token.
    
    Errore 401 se il refresh è invalido, scaduto, o di tipo sbagliato.
    
    Nota: il refresh token vecchio rimane valido fino alla sua scadenza
    naturale. In una versione successiva implementeremo "refresh rotation"
    e una blacklist per invalidare i token compromessi.
    """
    try:
        user_id = decode_token(payload.refresh_token, expected_type=TokenType.REFRESH)
    except TokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Refresh token invalido",
        ) from e
    
    # Verifica che l'utente esista ancora (potrebbe essere stato cancellato)
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utente non trovato",
        )
    
    return _build_token_pair(user)


# ============================================================
# ME
# ============================================================

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Restituisce l'utente corrente (richiede token)",
)
async def me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """
    Endpoint protetto. Funziona solo se l'header
    `Authorization: Bearer <access_token>` è presente e valido.
    """
    return UserResponse.model_validate(current_user)