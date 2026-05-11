"""
Test integrazione endpoint /categories.
"""

import uuid

import pytest
from httpx import AsyncClient


def _unique_email() -> str:
    return f"test-cat-{uuid.uuid4().hex[:12]}@example.com"


async def _register_and_get_token(client: AsyncClient) -> str:
    """Registra un utente e restituisce un access token."""
    response = await client.post(
        "/auth/register",
        json={
            "email": _unique_email(),
            "password": "ciaociao123",
            "display_name": "Test Cat",
        },
    )
    return response.json()["tokens"]["access_token"]


async def _auth_headers(client: AsyncClient) -> dict[str, str]:
    token = await _register_and_get_token(client)
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_list_categories_returns_system_categories(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.get("/categories", headers=headers)
    assert response.status_code == 200
    
    categories = response.json()
    # Almeno una di sistema (potrebbero essere state seedate)
    system_cats = [c for c in categories if c["is_system"]]
    assert len(system_cats) > 0


@pytest.mark.asyncio
async def test_list_categories_requires_auth(client: AsyncClient):
    response = await client.get("/categories")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_category_success(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.post(
        "/categories",
        json={"name": "Categoria di test", "icon": "test", "color": "#000"},
        headers=headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Categoria di test"
    assert body["is_system"] is False
    assert body["user_id"] is not None


@pytest.mark.asyncio
async def test_create_category_duplicate_name_returns_400(client: AsyncClient):
    headers = await _auth_headers(client)
    payload = {"name": "Duplicata"}
    
    r1 = await client.post("/categories", json=payload, headers=headers)
    assert r1.status_code == 201
    
    r2 = await client.post("/categories", json=payload, headers=headers)
    assert r2.status_code == 400


@pytest.mark.asyncio
async def test_create_category_short_name_returns_422(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.post(
        "/categories",
        json={"name": ""},   # vuoto
        headers=headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_own_category(client: AsyncClient):
    headers = await _auth_headers(client)
    
    create = await client.post(
        "/categories", json={"name": "Original"}, headers=headers
    )
    cat_id = create.json()["id"]
    
    response = await client.patch(
        f"/categories/{cat_id}",
        json={"name": "Renamed"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Renamed"


@pytest.mark.asyncio
async def test_update_system_category_returns_404(client: AsyncClient):
    headers = await _auth_headers(client)
    
    # Prendi una categoria di sistema
    list_resp = await client.get("/categories", headers=headers)
    system_cat = next(c for c in list_resp.json() if c["is_system"])
    
    response = await client.patch(
        f"/categories/{system_cat['id']}",
        json={"name": "Hackerata"},
        headers=headers,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_own_category(client: AsyncClient):
    headers = await _auth_headers(client)
    
    create = await client.post(
        "/categories", json={"name": "Da eliminare"}, headers=headers
    )
    cat_id = create.json()["id"]
    
    response = await client.delete(f"/categories/{cat_id}", headers=headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_system_category_returns_404(client: AsyncClient):
    headers = await _auth_headers(client)
    
    list_resp = await client.get("/categories", headers=headers)
    system_cat = next(c for c in list_resp.json() if c["is_system"])
    
    response = await client.delete(
        f"/categories/{system_cat['id']}", headers=headers
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_user_cannot_see_other_users_categories(client: AsyncClient):
    """
    Sicurezza: un utente non deve vedere le categorie custom di un altro utente.
    """
    # Utente A crea una categoria
    headers_a = await _auth_headers(client)
    create = await client.post(
        "/categories", json={"name": "Solo per A"}, headers=headers_a
    )
    cat_id = create.json()["id"]
    
    # Utente B prova ad accedervi
    headers_b = await _auth_headers(client)
    response = await client.get(f"/categories/{cat_id}", headers=headers_b)
    assert response.status_code == 404
    
    # Utente B prova a modificarla
    response = await client.patch(
        f"/categories/{cat_id}", json={"name": "Hackerata"}, headers=headers_b
    )
    assert response.status_code == 404