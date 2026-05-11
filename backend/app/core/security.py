"""
Utility di sicurezza: hash delle password.

I JWT (creazione e verifica dei token) li metteremo in un modulo
separato nel prossimo sotto-step.
"""

from passlib.context import CryptContext


# ============================================================
# PASSWORD HASHING
# ============================================================
# CryptContext è la "facciata" di passlib: gestisce hashing,
# verifica, e migrazione futura di algoritmo (es. se un domani
# vogliamo passare a un Argon2 con parametri più forti, basta
# riconfigurare qui e gli hash vecchi vengono accettati lo stesso).
#
# `schemes=["argon2"]` → usiamo Argon2 (variante "id" di default)
# `deprecated="auto"` → se in futuro aggiungiamo altri schemi,
#                       quelli vecchi vengono marcati come deprecati
# ============================================================
_pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
)


def hash_password(plain_password: str) -> str:
    """
    Genera l'hash Argon2id di una password.
    
    Esempio di output:
        $argon2id$v=19$m=65536,t=3,p=4$<salt>$<hash>
    
    Il salt e i parametri sono inclusi nell'hash, quindi basta
    salvare questa stringa nel DB. Non serve un campo separato.
    """
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica che una password in chiaro corrisponda all'hash.
    
    Restituisce True se match, False altrimenti.
    
    Non solleva eccezioni nemmeno se l'hash è malformato: in quel
    caso restituisce False (sicurezza by default).
    """
    try:
        return _pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # Hash corrotto o algoritmo sconosciuto: trattiamo come "no match"
        return False


def password_needs_rehash(hashed_password: str) -> bool:
    """
    True se l'hash usa parametri vecchi e andrebbe rigenerato.
    
    Tipico flow:
        if verify_password(plain, hashed):
            if password_needs_rehash(hashed):
                new_hash = hash_password(plain)
                # ... aggiorna DB con new_hash
    
    Lo useremo dopo il login se in futuro alziamo i parametri di Argon2.
    """
    return _pwd_context.needs_update(hashed_password)