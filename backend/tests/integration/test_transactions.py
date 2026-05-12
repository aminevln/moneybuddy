"""
Test integrazione endpoint /transactions.
"""

import uuid
from datetime import datetime, timezone

import pytest
from httpx import AsyncClient


def _unique_email() -> str:
    return f"test-txn-{uuid.uuid4().hex[:12]}@example.com"


async def _register_and_get_token(client: AsyncClient) -> str:
    response = await client.post(
        "/auth/register",
        json={
            "email": _unique_email(),
            "password": "ciaociao123",
            "display_name": "Test Txn",
        },
    )
    return response.json()["tokens"]["access_token"]


async def _auth_headers(client: AsyncClient) -> dict[str, str]:
    token = await _register_and_get_token(client)
    return {"Authorization": f"Bearer {token}"}


async def _create_account(
    client: AsyncClient, headers: dict[str, str], balance: float = 1000
) -> str:
    """Helper: crea un account e ritorna il suo id."""
    response = await client.post(
        "/accounts",
        json={
            "name": f"Test {uuid.uuid4().hex[:6]}",
            "type": "checking",
            "initial_balance": balance,
        },
        headers=headers,
    )
    return response.json()["id"]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ============================================================
# CREATE
# ============================================================

@pytest.mark.asyncio
async def test_create_expense_transaction(client: AsyncClient):
    headers = await _auth_headers(client)
    account_id = await _create_account(client, headers, balance=1000)
    
    response = await client.post(
        "/transactions",
        json={
            "account_id": account_id,
            "direction": "expense",
            "amount": 50,
            "description": "Spesa",
            "occurred_at": _now_iso(),
        },
        headers=headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["direction"] == "expense"
    assert body["status"] == "cleared"
    assert body["voided_at"] is None


@pytest.mark.asyncio
async def test_create_transaction_updates_account_balance(client: AsyncClient):
    """Il trigger DB deve aggiornare il balance dell'account."""
    headers = await _auth_headers(client)
    account_id = await _create_account(client, headers, balance=1000)
    
    # Spesa 50€
    await client.post(
        "/transactions",
        json={
            "account_id": account_id,
            "direction": "expense",
            "amount": 50,
            "description": "Test",
            "occurred_at": _now_iso(),
        },
        headers=headers,
    )
    
    # Verifica balance
    response = await client.get(f"/accounts/{account_id}", headers=headers)
    assert float(response.json()["current_balance"]) == 950.0


@pytest.mark.asyncio
async def test_create_income_transaction_increases_balance(client: AsyncClient):
    headers = await _auth_headers(client)
    account_id = await _create_account(client, headers, balance=100)
    
    await client.post(
        "/transactions",
        json={
            "account_id": account_id,
            "direction": "income",
            "amount": 500,
            "description": "Stipendio",
            "occurred_at": _now_iso(),
        },
        headers=headers,
    )
    
    response = await client.get(f"/accounts/{account_id}", headers=headers)
    assert float(response.json()["current_balance"]) == 600.0


@pytest.mark.asyncio
async def test_create_with_nonexistent_account_returns_400(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.post(
        "/transactions",
        json={
            "account_id": "00000000-0000-0000-0000-000000000000",
            "direction": "expense",
            "amount": 10,
            "description": "Test",
            "occurred_at": _now_iso(),
        },
        headers=headers,
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_create_with_other_users_account_returns_400(client: AsyncClient):
    """Un utente NON può creare transazioni sull'account di un altro."""
    headers_a = await _auth_headers(client)
    account_a = await _create_account(client, headers_a)
    
    headers_b = await _auth_headers(client)
    response = await client.post(
        "/transactions",
        json={
            "account_id": account_a,  # account di A!
            "direction": "expense",
            "amount": 10,
            "description": "Hack",
            "occurred_at": _now_iso(),
        },
        headers=headers_b,
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_create_negative_amount_returns_422(client: AsyncClient):
    headers = await _auth_headers(client)
    account_id = await _create_account(client, headers)
    
    response = await client.post(
        "/transactions",
        json={
            "account_id": account_id,
            "direction": "expense",
            "amount": -10,
            "description": "Test",
            "occurred_at": _now_iso(),
        },
        headers=headers,
    )
    assert response.status_code == 422


# ============================================================
# LIST
# ============================================================

@pytest.mark.asyncio
async def test_list_transactions_empty(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.get("/transactions", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["items"] == []
    assert body["total"] == 0


@pytest.mark.asyncio
async def test_list_transactions_returns_only_own(client: AsyncClient):
    """Un utente vede SOLO le sue transazioni."""
    headers_a = await _auth_headers(client)
    account_a = await _create_account(client, headers_a)
    await client.post(
        "/transactions",
        json={
            "account_id": account_a,
            "direction": "expense",
            "amount": 10,
            "description": "Solo A",
            "occurred_at": _now_iso(),
        },
        headers=headers_a,
    )
    
    headers_b = await _auth_headers(client)
    response = await client.get("/transactions", headers=headers_b)
    assert response.json()["items"] == []


@pytest.mark.asyncio
async def test_list_filters_by_direction(client: AsyncClient):
    headers = await _auth_headers(client)
    account_id = await _create_account(client, headers)
    
    await client.post(
        "/transactions",
        json={
            "account_id": account_id,
            "direction": "expense",
            "amount": 10,
            "description": "Out",
            "occurred_at": _now_iso(),
        },
        headers=headers,
    )
    await client.post(
        "/transactions",
        json={
            "account_id": account_id,
            "direction": "income",
            "amount": 100,
            "description": "In",
            "occurred_at": _now_iso(),
        },
        headers=headers,
    )
    
    response = await client.get("/transactions?direction=expense", headers=headers)
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["description"] == "Out"


@pytest.mark.asyncio
async def test_list_pagination(client: AsyncClient):
    headers = await _auth_headers(client)
    account_id = await _create_account(client, headers, balance=10000)
    
    # Crea 5 transazioni
    for i in range(5):
        await client.post(
            "/transactions",
            json={
                "account_id": account_id,
                "direction": "expense",
                "amount": 1,
                "description": f"Txn {i}",
                "occurred_at": _now_iso(),
            },
            headers=headers,
        )
    
    response = await client.get("/transactions?page=1&page_size=2", headers=headers)
    body = response.json()
    assert len(body["items"]) == 2
    assert body["total"] == 5
    assert body["has_more"] is True
    
    response = await client.get("/transactions?page=3&page_size=2", headers=headers)
    body = response.json()
    assert len(body["items"]) == 1
    assert body["has_more"] is False


# ============================================================
# UPDATE
# ============================================================

@pytest.mark.asyncio
async def test_update_description(client: AsyncClient):
    headers = await _auth_headers(client)
    account_id = await _create_account(client, headers)
    create = await client.post(
        "/transactions",
        json={
            "account_id": account_id,
            "direction": "expense",
            "amount": 10,
            "description": "Original",
            "occurred_at": _now_iso(),
        },
        headers=headers,
    )
    txn_id = create.json()["id"]
    
    response = await client.patch(
        f"/transactions/{txn_id}",
        json={"description": "Updated"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["description"] == "Updated"


@pytest.mark.asyncio
async def test_update_cannot_change_amount(client: AsyncClient):
    """Amount NON è in TransactionUpdate, Pydantic lo ignora."""
    headers = await _auth_headers(client)
    account_id = await _create_account(client, headers)
    create = await client.post(
        "/transactions",
        json={
            "account_id": account_id,
            "direction": "expense",
            "amount": 10,
            "description": "Test",
            "occurred_at": _now_iso(),
        },
        headers=headers,
    )
    txn_id = create.json()["id"]
    
    response = await client.patch(
        f"/transactions/{txn_id}",
        json={"amount": 999, "description": "Renamed"},
        headers=headers,
    )
    assert response.status_code == 200
    # amount deve essere rimasto invariato
    assert float(response.json()["amount"]) == 10.0


# ============================================================
# VOID
# ============================================================

@pytest.mark.asyncio
async def test_void_transaction(client: AsyncClient):
    headers = await _auth_headers(client)
    account_id = await _create_account(client, headers)
    create = await client.post(
        "/transactions",
        json={
            "account_id": account_id,
            "direction": "expense",
            "amount": 10,
            "description": "ToVoid",
            "occurred_at": _now_iso(),
        },
        headers=headers,
    )
    txn_id = create.json()["id"]
    
    response = await client.delete(f"/transactions/{txn_id}", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "voided"
    assert body["voided_at"] is not None


@pytest.mark.asyncio
async def test_void_already_voided_returns_400(client: AsyncClient):
    headers = await _auth_headers(client)
    account_id = await _create_account(client, headers)
    create = await client.post(
        "/transactions",
        json={
            "account_id": account_id,
            "direction": "expense",
            "amount": 10,
            "description": "Test",
            "occurred_at": _now_iso(),
        },
        headers=headers,
    )
    txn_id = create.json()["id"]
    
    await client.delete(f"/transactions/{txn_id}", headers=headers)
    
    response = await client.delete(f"/transactions/{txn_id}", headers=headers)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_voided_transactions_excluded_by_default(client: AsyncClient):
    headers = await _auth_headers(client)
    account_id = await _create_account(client, headers)
    create = await client.post(
        "/transactions",
        json={
            "account_id": account_id,
            "direction": "expense",
            "amount": 10,
            "description": "ToVoid",
            "occurred_at": _now_iso(),
        },
        headers=headers,
    )
    txn_id = create.json()["id"]
    await client.delete(f"/transactions/{txn_id}", headers=headers)
    
    # Default: voided escluse
    response = await client.get("/transactions", headers=headers)
    assert response.json()["total"] == 0
    
    # Con include_voided: 1
    response = await client.get("/transactions?include_voided=true", headers=headers)
    assert response.json()["total"] == 1