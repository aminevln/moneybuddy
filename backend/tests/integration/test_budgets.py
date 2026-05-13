"""Test integrazione endpoint /budgets."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

import pytest
from httpx import AsyncClient


async def _auth_headers(client: AsyncClient) -> dict[str, str]:
    response = await client.post(
        "/auth/register",
        json={
            "email": f"test-budget-{uuid.uuid4().hex[:12]}@example.com",
            "password": "ciaociao123",
            "display_name": "Budget Test",
        },
    )
    token = response.json()["tokens"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


async def _create_account(client: AsyncClient, headers: dict[str, str]) -> str:
    response = await client.post(
        "/accounts",
        json={"name": f"Test {uuid.uuid4().hex[:6]}", "type": "checking", "initial_balance": 10000},
        headers=headers,
    )
    return response.json()["id"]


async def _create_category(client: AsyncClient, headers: dict[str, str]) -> str:
    response = await client.post(
        "/categories",
        json={"name": f"Test {uuid.uuid4().hex[:6]}"},
        headers=headers,
    )
    return response.json()["id"]


async def _create_expense(
    client: AsyncClient,
    headers: dict[str, str],
    account_id: str,
    category_id: str | None,
    amount: float,
) -> str:
    response = await client.post(
        "/transactions",
        json={
            "account_id": account_id,
            "category_id": category_id,
            "direction": "expense",
            "amount": amount,
            "description": "Test expense",
            "occurred_at": datetime.now(timezone.utc).isoformat(),
        },
        headers=headers,
    )
    return response.json()["id"]


# ============================================================
# BASIC CRUD
# ============================================================

@pytest.mark.asyncio
async def test_list_budgets_empty(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.get("/budgets", headers=headers)
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_budget(client: AsyncClient):
    headers = await _auth_headers(client)
    category_id = await _create_category(client, headers)
    
    response = await client.post(
        "/budgets",
        json={
            "category_id": category_id,
            "period": "monthly",
            "amount_limit": 200,
        },
        headers=headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["period"] == "monthly"
    assert Decimal(body["amount_limit"]) == Decimal("200")
    assert body["is_active"] is True


@pytest.mark.asyncio
async def test_create_budget_without_category(client: AsyncClient):
    """Budget globale, senza categoria."""
    headers = await _auth_headers(client)
    response = await client.post(
        "/budgets",
        json={
            "category_id": None,
            "period": "monthly",
            "amount_limit": 1500,
        },
        headers=headers,
    )
    assert response.status_code == 201
    assert response.json()["category_id"] is None


@pytest.mark.asyncio
async def test_create_budget_nonexistent_category_returns_400(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.post(
        "/budgets",
        json={
            "category_id": "00000000-0000-0000-0000-000000000000",
            "period": "monthly",
            "amount_limit": 100,
        },
        headers=headers,
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_create_budget_negative_amount_returns_422(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.post(
        "/budgets",
        json={
            "period": "monthly",
            "amount_limit": -100,
        },
        headers=headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_budget_amount(client: AsyncClient):
    headers = await _auth_headers(client)
    create = await client.post(
        "/budgets",
        json={"period": "monthly", "amount_limit": 100},
        headers=headers,
    )
    budget_id = create.json()["id"]
    
    response = await client.patch(
        f"/budgets/{budget_id}",
        json={"amount_limit": 150},
        headers=headers,
    )
    assert response.status_code == 200
    assert Decimal(response.json()["amount_limit"]) == Decimal("150")


@pytest.mark.asyncio
async def test_delete_budget(client: AsyncClient):
    headers = await _auth_headers(client)
    create = await client.post(
        "/budgets",
        json={"period": "monthly", "amount_limit": 100},
        headers=headers,
    )
    budget_id = create.json()["id"]
    
    response = await client.delete(f"/budgets/{budget_id}", headers=headers)
    assert response.status_code == 204
    
    response = await client.get(f"/budgets/{budget_id}", headers=headers)
    assert response.status_code == 404


# ============================================================
# STATUS WITH SPENT CALCULATION
# ============================================================

@pytest.mark.asyncio
async def test_status_empty(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.get("/budgets/status", headers=headers)
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_status_with_no_transactions(client: AsyncClient):
    """Budget appena creato, niente spese ancora."""
    headers = await _auth_headers(client)
    await client.post(
        "/budgets",
        json={"period": "monthly", "amount_limit": 200},
        headers=headers,
    )
    
    response = await client.get("/budgets/status", headers=headers)
    body = response.json()
    assert len(body) == 1
    assert Decimal(body[0]["spent"]) == Decimal("0")
    assert Decimal(body[0]["remaining"]) == Decimal("200")
    assert Decimal(body[0]["percentage"]) == Decimal("0")


@pytest.mark.asyncio
async def test_status_with_matching_expenses(client: AsyncClient):
    """Test core: la spesa nella categoria viene contata nel budget."""
    headers = await _auth_headers(client)
    account_id = await _create_account(client, headers)
    category_id = await _create_category(client, headers)
    
    # Budget mensile categoria specifica: 100€
    await client.post(
        "/budgets",
        json={
            "category_id": category_id,
            "period": "monthly",
            "amount_limit": 100,
        },
        headers=headers,
    )
    
    # 2 spese da 25€ ciascuna in quella categoria
    await _create_expense(client, headers, account_id, category_id, 25)
    await _create_expense(client, headers, account_id, category_id, 25)
    
    response = await client.get("/budgets/status", headers=headers)
    body = response.json()[0]
    assert Decimal(body["spent"]) == Decimal("50")
    assert Decimal(body["remaining"]) == Decimal("50")
    assert Decimal(body["percentage"]) == Decimal("50")


@pytest.mark.asyncio
async def test_status_ignores_other_category(client: AsyncClient):
    """Una spesa in ALTRA categoria non deve contare nel budget."""
    headers = await _auth_headers(client)
    account_id = await _create_account(client, headers)
    cat_a = await _create_category(client, headers)
    cat_b = await _create_category(client, headers)
    
    # Budget per cat_a
    await client.post(
        "/budgets",
        json={"category_id": cat_a, "period": "monthly", "amount_limit": 100},
        headers=headers,
    )
    
    # Spesa in cat_b (NON contata)
    await _create_expense(client, headers, account_id, cat_b, 30)
    
    response = await client.get("/budgets/status", headers=headers)
    assert Decimal(response.json()[0]["spent"]) == Decimal("0")


@pytest.mark.asyncio
async def test_status_global_budget_counts_all_expenses(client: AsyncClient):
    """Budget globale (no categoria) somma tutte le expense."""
    headers = await _auth_headers(client)
    account_id = await _create_account(client, headers)
    cat = await _create_category(client, headers)
    
    # Budget globale
    await client.post(
        "/budgets",
        json={"period": "monthly", "amount_limit": 1500},
        headers=headers,
    )
    
    # Spese in cat_a e senza categoria
    await _create_expense(client, headers, account_id, cat, 50)
    await _create_expense(client, headers, account_id, None, 70)
    
    response = await client.get("/budgets/status", headers=headers)
    assert Decimal(response.json()[0]["spent"]) == Decimal("120")


@pytest.mark.asyncio
async def test_status_ignores_voided_transactions(client: AsyncClient):
    """Le transazioni annullate non vengono contate."""
    headers = await _auth_headers(client)
    account_id = await _create_account(client, headers)
    category_id = await _create_category(client, headers)
    
    await client.post(
        "/budgets",
        json={"category_id": category_id, "period": "monthly", "amount_limit": 100},
        headers=headers,
    )
    
    # Crea spesa, poi voida
    txn_id = await _create_expense(client, headers, account_id, category_id, 50)
    await client.delete(f"/transactions/{txn_id}", headers=headers)
    
    response = await client.get("/budgets/status", headers=headers)
    assert Decimal(response.json()[0]["spent"]) == Decimal("0")


@pytest.mark.asyncio
async def test_status_only_active_filters(client: AsyncClient):
    """only_active=true (default) esclude i budget disattivati."""
    headers = await _auth_headers(client)
    create = await client.post(
        "/budgets",
        json={"period": "monthly", "amount_limit": 100},
        headers=headers,
    )
    budget_id = create.json()["id"]
    
    # Disattiva
    await client.patch(
        f"/budgets/{budget_id}",
        json={"is_active": False},
        headers=headers,
    )
    
    # Default: non lo vediamo
    response = await client.get("/budgets/status", headers=headers)
    assert response.json() == []
    
    # Con only_active=false: lo vediamo
    response = await client.get("/budgets/status?only_active=false", headers=headers)
    assert len(response.json()) == 1