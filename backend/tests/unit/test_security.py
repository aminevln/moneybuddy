"""
Test del modulo security.
"""

from app.core.security import (
    hash_password,
    verify_password,
    password_needs_rehash,
)


def test_hash_password_returns_argon2_string():
    h = hash_password("mypassword")
    assert h.startswith("$argon2"), f"hash inatteso: {h}"


def test_hash_is_different_each_time():
    """Due hash della stessa password devono essere diversi (salt random)."""
    h1 = hash_password("mypassword")
    h2 = hash_password("mypassword")
    assert h1 != h2


def test_verify_password_success():
    h = hash_password("mypassword")
    assert verify_password("mypassword", h) is True


def test_verify_password_wrong_password():
    h = hash_password("mypassword")
    assert verify_password("wrongpassword", h) is False


def test_verify_password_malformed_hash_returns_false():
    """Hash invalido non solleva eccezione, restituisce False."""
    assert verify_password("anything", "not-a-valid-hash") is False


def test_password_needs_rehash_with_current_hash():
    """Hash appena generato non deve necessitare rehash."""
    h = hash_password("mypassword")
    assert password_needs_rehash(h) is False