"""Test integrazione endpoint /analytics."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

import pytest
from httpx import AsyncClient


async def _auth_headers(client: AsyncClient) -> dict[str, str]:
    response = await client.post(
        "/auth/register",
        json={
            "email": f"test-analytics-{uuid.uuid4().hex[:12]}@example.com",
            "password": "ciaociao123",
            "display_name": "Analytics Test",
        },
    )
    return {"Authorization": f"Bearer {response.json()['tokens']['access_token']}"}


async def _create_account(client: AsyncClient, headers: dict[str, str]) -> str:
    response = await client.post(
        "/accounts",
        json={"name": "T", "type": "checking", "initial_balance": 10000},
        headers=headers,
    )
    return response.json()["id"]


async def _create_category(client: AsyncClient, headers: dict[str, str], name: str = "Test") -> str:
    response = await client.post(
        "/categories",
        json={"name": f"{name} {uuid.uuid4().hex[:6]}"},
        headers=headers,
    )
    return response.json()["id"]


async def _create_expense(
    client: AsyncClient,
    headers: dict[str, str],
    account_id: str,
    amount: float,
    category_id: str | None = None,
) -> None:
    await client.post(
        "/transactions",
        json={
            "account_id": account_id,
            "category_id": category_id,
            "direction": "expense",
            "amount": amount,
            "description": "Test",
            "occurred_at": datetime.now(timezone.utc).isoformat(),
        },
        headers=headers,
    )


async def _create_income(
    client: AsyncClient,
    headers: dict[str, str],
    account_id: str,
    amount: float,
) -> None:
    await client.post(
        "/transactions",
        json={
            "account_id": account_id,
            "direction": "income",
            "amount": amount,
            "description": "Test",
            "occurred_at": datetime.now(timezone.utc).isoformat(),
        },
        headers=headers,
    )


@pytest.mark.asyncio
async def test_overview_empty(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.get("/analytics/overview", headers=headers)
    assert response.status_code == 200
    body = response.json()
    
    assert Decimal(body["monthly_comparison"]["current_month_income"]) == Decimal("0")
    assert Decimal(body["monthly_comparison"]["current_month_expense"]) == Decimal("0")
    assert body["category_breakdown"] == []


@pytest.mark.asyncio
async def test_overview_with_transactions(client: AsyncClient):
    headers = await _auth_headers(client)
    account_id = await _create_account(client, headers)
    
    # Crea income + 3 expenses (2 stessa categoria, 1 senza categoria)
    await _create_income(client, headers, account_id, 1000)
    
    cat_id = await _create_category(client, headers, "Cibo")
    await _create_expense(client, headers, account_id, 50, cat_id)
    await _create_expense(client, headers, account_id, 30, cat_id)
    await _create_expense(client, headers, account_id, 20, None)  # senza categoria
    
    response = await client.get("/analytics/overview", headers=headers)
    body = response.json()
    
    assert Decimal(body["monthly_comparison"]["current_month_income"]) == Decimal("1000")
    assert Decimal(body["monthly_comparison"]["current_month_expense"]) == Decimal("100")
    
    # 2 categorie nel breakdown: la "Cibo X" (80€) e "Senza categoria" (20€)
    breakdown = body["category_breakdown"]
    assert len(breakdown) == 2
    
    # Ordinato per total DESC
    assert Decimal(breakdown[0]["total_spent"]) == Decimal("80")
    assert breakdown[0]["transaction_count"] == 2
    assert Decimal(breakdown[1]["total_spent"]) == Decimal("20")
    assert breakdown[1]["category_name"] == "Senza categoria"


@pytest.mark.asyncio
async def test_overview_ignores_voided(client: AsyncClient):
    """Le transazioni voided non devono essere contate."""
    headers = await _auth_headers(client)
    account_id = await _create_account(client, headers)
    
    # Crea una spesa, poi voidala
    create_response = await client.post(
        "/transactions",
        json={
            "account_id": account_id,
            "direction": "expense",
            "amount": 100,
            "description": "Test",
            "occurred_at": datetime.now(timezone.utc).isoformat(),
        },
        headers=headers,
    )
    txn_id = create_response.json()["id"]
    await client.delete(f"/transactions/{txn_id}", headers=headers)
    
    response = await client.get("/analytics/overview", headers=headers)
    body = response.json()
    
    assert Decimal(body["monthly_comparison"]["current_month_expense"]) == Decimal("0")
    assert body["category_breakdown"] == []


@pytest.mark.asyncio
async def test_overview_requires_auth(client: AsyncClient):
    response = await client.get("/analytics/overview")
    assert response.status_code == 401