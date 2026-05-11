"""
Test di integrazione degli endpoint /auth.

ATTENZIONE: questi test usano il DB di sviluppo (lo stesso che usi via
make backend). Nel Blocco 8 introdurremo un DB di test separato e
fixtures che lo puliscano. Per ora usiamo email uniche per evitare
collisioni tra test e tra esecuzioni.
"""

import uuid
import pytest
from httpx import AsyncClient


def _unique_email() -> str:
    """Genera una email unica per evitare collisioni nel DB."""
    return f"test-{uuid.uuid4().hex[:12]}@example.com"


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    email = _unique_email()
    response = await client.post(
        "/auth/register",
        json={
            "email": email,
            "password": "ciaociao123",
            "display_name": "Test User",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == email
    assert body["display_name"] == "Test User"
    assert "id" in body
    # Garanzia di sicurezza: nessun campo sensibile
    assert "password" not in body
    assert "password_hash" not in body


@pytest.mark.asyncio
async def test_register_duplicate_email_returns_400(client: AsyncClient):
    email = _unique_email()
    payload = {
        "email": email,
        "password": "ciaociao123",
        "display_name": "Test",
    }
    
    # Prima registrazione: ok
    r1 = await client.post("/auth/register", json=payload)
    assert r1.status_code == 201
    
    # Seconda con la stessa email: 400
    r2 = await client.post("/auth/register", json=payload)
    assert r2.status_code == 400
    assert "già registrata" in r2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_short_password_returns_422(client: AsyncClient):
    response = await client.post(
        "/auth/register",
        json={
            "email": _unique_email(),
            "password": "abc",  # troppo corta
            "display_name": "Test",
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_invalid_email_returns_422(client: AsyncClient):
    response = await client.post(
        "/auth/register",
        json={
            "email": "non-una-email",
            "password": "ciaociao123",
            "display_name": "Test",
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    email = _unique_email()
    password = "ciaociao123"
    
    # Registra
    await client.post(
        "/auth/register",
        json={"email": email, "password": password, "display_name": "Test"},
    )
    
    # Login
    response = await client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    assert response.json()["email"] == email


@pytest.mark.asyncio
async def test_login_wrong_password_returns_401(client: AsyncClient):
    email = _unique_email()
    
    await client.post(
        "/auth/register",
        json={"email": email, "password": "ciaociao123", "display_name": "Test"},
    )
    
    response = await client.post(
        "/auth/login",
        json={"email": email, "password": "sbagliata123"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_email_returns_401(client: AsyncClient):
    """Importante: stesso 401 sia per email inesistente che password sbagliata."""
    response = await client.post(
        "/auth/login",
        json={
            "email": _unique_email(),  # non registrato
            "password": "qualsiasi123",
        },
    )
    assert response.status_code == 401