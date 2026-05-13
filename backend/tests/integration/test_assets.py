"""Test integrazione endpoint /assets."""

import uuid

import pytest
from httpx import AsyncClient


async def _auth_headers(client: AsyncClient) -> dict[str, str]:
    response = await client.post(
        "/auth/register",
        json={
            "email": f"test-asset-{uuid.uuid4().hex[:12]}@example.com",
            "password": "ciaociao123",
            "display_name": "Asset Test",
        },
    )
    token = response.json()["tokens"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_list_assets_empty(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.get("/assets", headers=headers)
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_asset(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.post(
        "/assets",
        json={
            "name": "Felix il gatto",
            "asset_type": "pet",
            "details": "Gatto persiano, 3 anni",
            "metadata": {"vet": "Dr. Rossi"},
        },
        headers=headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Felix il gatto"
    assert body["metadata"]["vet"] == "Dr. Rossi"


@pytest.mark.asyncio
async def test_update_asset(client: AsyncClient):
    headers = await _auth_headers(client)
    create = await client.post(
        "/assets",
        json={"name": "Auto", "asset_type": "car"},
        headers=headers,
    )
    asset_id = create.json()["id"]
    
    response = await client.patch(
        f"/assets/{asset_id}",
        json={"details": "Aggiunti dettagli"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["details"] == "Aggiunti dettagli"


@pytest.mark.asyncio
async def test_delete_asset(client: AsyncClient):
    headers = await _auth_headers(client)
    create = await client.post(
        "/assets",
        json={"name": "Da eliminare", "asset_type": "other"},
        headers=headers,
    )
    asset_id = create.json()["id"]
    
    response = await client.delete(f"/assets/{asset_id}", headers=headers)
    assert response.status_code == 204
    
    response = await client.get(f"/assets/{asset_id}", headers=headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_user_cannot_see_other_users_assets(client: AsyncClient):
    headers_a = await _auth_headers(client)
    create = await client.post(
        "/assets",
        json={"name": "Privato A", "asset_type": "car"},
        headers=headers_a,
    )
    asset_id = create.json()["id"]
    
    headers_b = await _auth_headers(client)
    response = await client.get(f"/assets/{asset_id}", headers=headers_b)
    assert response.status_code == 404