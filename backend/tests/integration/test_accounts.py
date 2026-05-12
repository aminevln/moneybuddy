"""
Test integrazione endpoint /accounts.
"""

import uuid
from decimal import Decimal

import pytest
from httpx import AsyncClient


def _unique_email() -> str:
    return f"test-acc-{uuid.uuid4().hex[:12]}@example.com"


async def _register_and_get_token(client: AsyncClient) -> str:
    response = await client.post(
        "/auth/register",
        json={
            "email": _unique_email(),
            "password": "ciaociao123",
            "display_name": "Test Acc",
        },
    )
    return response.json()["tokens"]["access_token"]


async def _auth_headers(client: AsyncClient) -> dict[str, str]:
    token = await _register_and_get_token(client)
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_list_accounts_empty(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.get("/accounts", headers=headers)
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_list_accounts_requires_auth(client: AsyncClient):
    response = await client.get("/accounts")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_account_success(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.post(
        "/accounts",
        json={
            "name": "Conto Test",
            "type": "checking",
            "initial_balance": 1000,
            "is_spendable": True,
        },
        headers=headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Conto Test"
    assert body["type"] == "checking"
    assert Decimal(body["current_balance"]) == Decimal("1000")
    assert body["is_spendable"] is True


@pytest.mark.asyncio
async def test_create_account_with_zero_balance(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.post(
        "/accounts",
        json={"name": "Vuoto", "type": "cash"},  # initial_balance default 0
        headers=headers,
    )
    assert response.status_code == 201
    assert Decimal(response.json()["current_balance"]) == Decimal("0")


@pytest.mark.asyncio
async def test_create_account_negative_balance_returns_422(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.post(
        "/accounts",
        json={
            "name": "Negativo",
            "type": "checking",
            "initial_balance": -100,
        },
        headers=headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_account_invalid_type_returns_422(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.post(
        "/accounts",
        json={"name": "Invalid", "type": "non_existent_type"},
        headers=headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_account_duplicate_name(client: AsyncClient):
    headers = await _auth_headers(client)
    payload = {"name": "Duplicato", "type": "checking"}
    
    r1 = await client.post("/accounts", json=payload, headers=headers)
    assert r1.status_code == 201
    
    r2 = await client.post("/accounts", json=payload, headers=headers)
    assert r2.status_code == 400


@pytest.mark.asyncio
async def test_summary_with_mixed_accounts(client: AsyncClient):
    headers = await _auth_headers(client)
    
    # Crea 4 account di tipo diverso
    accounts_to_create = [
        {"name": "Conto", "type": "checking", "initial_balance": 1500},
        {"name": "Cash", "type": "cash", "initial_balance": 80},
        {"name": "Buoni", "type": "meal_voucher", "initial_balance": 240, "is_spendable": False},
        {"name": "ETF", "type": "investment", "initial_balance": 5000, "is_spendable": False},
    ]
    for payload in accounts_to_create:
        await client.post("/accounts", json=payload, headers=headers)
    
    response = await client.get("/accounts/summary", headers=headers)
    assert response.status_code == 200
    summary = response.json()
    
    assert Decimal(summary["total_spendable"]) == Decimal("1580")
    assert Decimal(summary["total_meal_vouchers"]) == Decimal("240")
    assert Decimal(summary["total_investments"]) == Decimal("5000")
    assert Decimal(summary["total_all"]) == Decimal("6820")
    assert summary["accounts_count"] == 4


@pytest.mark.asyncio
async def test_update_account_name(client: AsyncClient):
    headers = await _auth_headers(client)
    create = await client.post(
        "/accounts",
        json={"name": "Vecchio", "type": "checking"},
        headers=headers,
    )
    account_id = create.json()["id"]
    
    response = await client.patch(
        f"/accounts/{account_id}",
        json={"name": "Nuovo"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Nuovo"


@pytest.mark.asyncio
async def test_update_account_cannot_change_type(client: AsyncClient):
    """Il campo 'type' non è in AccountUpdate, Pydantic lo accetta ma lo ignora."""
    headers = await _auth_headers(client)
    create = await client.post(
        "/accounts",
        json={"name": "Test", "type": "checking"},
        headers=headers,
    )
    account_id = create.json()["id"]
    original_type = create.json()["type"]
    
    # Passiamo "type" nel PATCH: Pydantic lo ignora (extra="ignore" implicito)
    response = await client.patch(
        f"/accounts/{account_id}",
        json={"type": "savings", "name": "Renamed"},
        headers=headers,
    )
    assert response.status_code == 200
    # Il tipo deve essere rimasto invariato
    assert response.json()["type"] == original_type
    assert response.json()["name"] == "Renamed"


@pytest.mark.asyncio
async def test_delete_account(client: AsyncClient):
    headers = await _auth_headers(client)
    create = await client.post(
        "/accounts",
        json={"name": "Da Eliminare", "type": "cash"},
        headers=headers,
    )
    account_id = create.json()["id"]
    
    response = await client.delete(f"/accounts/{account_id}", headers=headers)
    assert response.status_code == 204
    
    # Verifica che non esista più
    response = await client.get(f"/accounts/{account_id}", headers=headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_user_cannot_see_other_users_accounts(client: AsyncClient):
    headers_a = await _auth_headers(client)
    create = await client.post(
        "/accounts",
        json={"name": "Privato A", "type": "checking"},
        headers=headers_a,
    )
    account_id = create.json()["id"]
    
    headers_b = await _auth_headers(client)
    response = await client.get(f"/accounts/{account_id}", headers=headers_b)
    assert response.status_code == 404
    
    # B non vede A nemmeno nella lista
    response = await client.get("/accounts", headers=headers_b)
    assert response.status_code == 200
    assert response.json() == []