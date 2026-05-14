"""
Test integrazione endpoint /chat.

Marchiati come 'gemini' perché chiamano la vera API.
"""

import uuid

import pytest
from httpx import AsyncClient


pytestmark = pytest.mark.gemini


async def _auth_headers(client: AsyncClient) -> dict[str, str]:
    response = await client.post(
        "/auth/register",
        json={
            "email": f"test-chat-{uuid.uuid4().hex[:12]}@example.com",
            "password": "ciaociao123",
            "display_name": "Chat Test",
        },
    )
    return {"Authorization": f"Bearer {response.json()['tokens']['access_token']}"}


@pytest.mark.asyncio
async def test_get_empty_history(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.get("/chat/messages", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["messages"] == []
    assert body["session_id"] is not None


@pytest.mark.asyncio
async def test_send_first_message(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.post(
        "/chat/messages",
        json={"content": "Ciao, presentati brevemente"},
        headers=headers,
    )
    assert response.status_code == 201
    body = response.json()
    
    assert body["user_message"]["content"] == "Ciao, presentati brevemente"
    assert body["user_message"]["role"] == "user"
    assert body["assistant_message"]["role"] == "assistant"
    assert len(body["assistant_message"]["content"]) > 10   # risposta non vuota


@pytest.mark.asyncio
async def test_history_after_messages(client: AsyncClient):
    headers = await _auth_headers(client)
    
    # 2 messaggi
    await client.post("/chat/messages", json={"content": "Ciao"}, headers=headers)
    await client.post("/chat/messages", json={"content": "Come va?"}, headers=headers)
    
    response = await client.get("/chat/messages", headers=headers)
    body = response.json()
    # 2 user + 2 assistant = 4 messages
    assert len(body["messages"]) == 4
    
    # Verifica ordine cronologico
    roles = [m["role"] for m in body["messages"]]
    assert roles == ["user", "assistant", "user", "assistant"]


@pytest.mark.asyncio
async def test_session_persists_across_calls(client: AsyncClient):
    headers = await _auth_headers(client)
    
    r1 = await client.post("/chat/messages", json={"content": "Test 1"}, headers=headers)
    session_id_1 = r1.json()["user_message"]["session_id"]
    
    r2 = await client.post("/chat/messages", json={"content": "Test 2"}, headers=headers)
    session_id_2 = r2.json()["user_message"]["session_id"]
    
    # Stessa sessione per lo stesso utente
    assert session_id_1 == session_id_2


@pytest.mark.asyncio
async def test_chat_requires_auth(client: AsyncClient):
    response = await client.post("/chat/messages", json={"content": "ciao"})
    assert response.status_code == 401