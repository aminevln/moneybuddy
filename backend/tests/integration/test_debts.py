"""Test integrazione endpoint /debts."""

import uuid
from decimal import Decimal

import pytest
from httpx import AsyncClient


async def _auth_headers(client: AsyncClient) -> dict[str, str]:
    response = await client.post(
        "/auth/register",
        json={
            "email": f"test-debt-{uuid.uuid4().hex[:12]}@example.com",
            "password": "ciaociao123",
            "display_name": "Debt Test",
        },
    )
    token = response.json()["tokens"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_list_debts_empty(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.get("/debts", headers=headers)
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_debt(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.post(
        "/debts",
        json={
            "name": "Mutuo",
            "creditor": "Intesa",
            "initial_amount": 100000,
            "current_balance": 80000,
            "monthly_payment": 500,
            "interest_rate": 2.5,
        },
        headers=headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Mutuo"
    assert Decimal(body["initial_amount"]) == Decimal("100000")


@pytest.mark.asyncio
async def test_create_debt_negative_amount_returns_422(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.post(
        "/debts",
        json={
            "name": "Test",
            "initial_amount": -100,
            "current_balance": 0,
        },
        headers=headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_debt_invalid_interest_rate_returns_422(client: AsyncClient):
    """interest_rate deve essere tra 0 e 100."""
    headers = await _auth_headers(client)
    response = await client.post(
        "/debts",
        json={
            "name": "Test",
            "initial_amount": 100,
            "current_balance": 100,
            "interest_rate": 150,  # > 100
        },
        headers=headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_debt_current_balance(client: AsyncClient):
    headers = await _auth_headers(client)
    create = await client.post(
        "/debts",
        json={
            "name": "Mutuo",
            "initial_amount": 100000,
            "current_balance": 100000,
        },
        headers=headers,
    )
    debt_id = create.json()["id"]
    
    response = await client.patch(
        f"/debts/{debt_id}",
        json={"current_balance": 95000},
        headers=headers,
    )
    assert response.status_code == 200
    assert Decimal(response.json()["current_balance"]) == Decimal("95000")


@pytest.mark.asyncio
async def test_delete_debt(client: AsyncClient):
    headers = await _auth_headers(client)
    create = await client.post(
        "/debts",
        json={
            "name": "Da eliminare",
            "initial_amount": 1000,
            "current_balance": 1000,
        },
        headers=headers,
    )
    debt_id = create.json()["id"]
    
    response = await client.delete(f"/debts/{debt_id}", headers=headers)
    assert response.status_code == 204