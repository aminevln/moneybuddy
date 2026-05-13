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
            "creditor": "Intesa Sanpaolo",
            "original_amount": 100000,
            "remaining_amount": 80000,
            "monthly_payment": 500,
            "interest_rate": 0.025,
            "notes": "Mutuo prima casa",
        },
        headers=headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["creditor"] == "Intesa Sanpaolo"
    assert Decimal(body["original_amount"]) == Decimal("100000")
    assert Decimal(body["remaining_amount"]) == Decimal("80000")


@pytest.mark.asyncio
async def test_create_debt_minimal(client: AsyncClient):
    """Solo i campi obbligatori: creditor, original_amount, remaining_amount."""
    headers = await _auth_headers(client)
    response = await client.post(
        "/debts",
        json={
            "creditor": "Famiglia",
            "original_amount": 500,
            "remaining_amount": 500,
        },
        headers=headers,
    )
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_create_debt_missing_creditor_returns_422(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.post(
        "/debts",
        json={
            "original_amount": 100,
            "remaining_amount": 100,
        },
        headers=headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_debt_negative_amount_returns_422(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.post(
        "/debts",
        json={
            "creditor": "Test",
            "original_amount": -100,
            "remaining_amount": 0,
        },
        headers=headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_debt_invalid_interest_rate_returns_422(client: AsyncClient):
    """interest_rate deve essere tra 0 e 9.9999."""
    headers = await _auth_headers(client)
    response = await client.post(
        "/debts",
        json={
            "creditor": "Test",
            "original_amount": 100,
            "remaining_amount": 100,
            "interest_rate": 15,   # ben oltre 9.9999
        },
        headers=headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_debt_remaining_amount(client: AsyncClient):
    """Test del caso comune: l'utente paga una rata, aggiorna il residuo."""
    headers = await _auth_headers(client)
    create = await client.post(
        "/debts",
        json={
            "creditor": "Banca",
            "original_amount": 100000,
            "remaining_amount": 100000,
        },
        headers=headers,
    )
    debt_id = create.json()["id"]
    
    response = await client.patch(
        f"/debts/{debt_id}",
        json={"remaining_amount": 95000},
        headers=headers,
    )
    assert response.status_code == 200
    assert Decimal(response.json()["remaining_amount"]) == Decimal("95000")


@pytest.mark.asyncio
async def test_delete_debt(client: AsyncClient):
    headers = await _auth_headers(client)
    create = await client.post(
        "/debts",
        json={
            "creditor": "Test",
            "original_amount": 1000,
            "remaining_amount": 1000,
        },
        headers=headers,
    )
    debt_id = create.json()["id"]
    
    response = await client.delete(f"/debts/{debt_id}", headers=headers)
    assert response.status_code == 204