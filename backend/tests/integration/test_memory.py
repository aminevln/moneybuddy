"""
Test integrazione endpoint /ai/memory.

NB: questi test chiamano la VERA API di Gemini per generare embedding.
Sono lenti (~1-2s ognuno) e richiedono GOOGLE_API_KEY valido.
"""

import uuid

import pytest
from httpx import AsyncClient

# Tutti i test in questo file richiedono Gemini reale
pytestmark = pytest.mark.gemini

async def _auth_headers(client: AsyncClient) -> dict[str, str]:
    response = await client.post(
        "/auth/register",
        json={
            "email": f"test-mem-{uuid.uuid4().hex[:12]}@example.com",
            "password": "ciaociao123",
            "display_name": "Memory Test",
        },
    )
    return {"Authorization": f"Bearer {response.json()['tokens']['access_token']}"}


@pytest.mark.asyncio
async def test_create_memory_chunk(client: AsyncClient):
    headers = await _auth_headers(client)
    response = await client.post(
        "/ai/memory",
        json={
            "content": "L'utente lavora come sviluppatore.",
            "kind": "fact",
            "importance": 7,
        },
        headers=headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["content"] == "L'utente lavora come sviluppatore."
    assert body["kind"] == "fact"
    assert body["importance"] == 7
    assert body["access_count"] == 0


@pytest.mark.asyncio
async def test_list_memory_chunks(client: AsyncClient):
    headers = await _auth_headers(client)
    
    await client.post(
        "/ai/memory",
        json={"content": "Test 1", "kind": "fact"},
        headers=headers,
    )
    await client.post(
        "/ai/memory",
        json={"content": "Test 2", "kind": "preference"},
        headers=headers,
    )
    
    response = await client.get("/ai/memory", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 2


@pytest.mark.asyncio
async def test_list_filter_by_kind(client: AsyncClient):
    headers = await _auth_headers(client)
    
    await client.post(
        "/ai/memory",
        json={"content": "Fatto del profilo", "kind": "fact"},
        headers=headers,
    )
    await client.post(
        "/ai/memory",
        json={"content": "Preferenza personale", "kind": "preference"},
        headers=headers,
    )
    
    response = await client.get("/ai/memory?kind=preference", headers=headers)
    body = response.json()
    assert len(body) == 1
    assert body[0]["kind"] == "preference"


@pytest.mark.asyncio
async def test_search_similarity_finds_related(client: AsyncClient):
    """
    Il test fondamentale: la ricerca semantica funziona davvero.
    """
    headers = await _auth_headers(client)
    
    # Chunk relativo al gatto
    await client.post(
        "/ai/memory",
        json={
            "content": "Ho un gatto persiano di nome Felix che ha 3 anni.",
            "kind": "fact",
            "importance": 7,
        },
        headers=headers,
    )
    # Chunk non correlato
    await client.post(
        "/ai/memory",
        json={
            "content": "Lavoro a Torino come sviluppatore.",
            "kind": "fact",
            "importance": 5,
        },
        headers=headers,
    )
    
    # Cerca con query semantica diversa ma collegata
    response = await client.post(
        "/ai/memory/search",
        json={"query": "il mio animale domestico", "limit": 5},
        headers=headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body) >= 1
    
    # Il primo risultato dovrebbe essere il chunk di Felix
    top_content = body[0]["chunk"]["content"]
    assert "Felix" in top_content or "gatto" in top_content.lower()
    
    # Similarity decente (>0.3 è un threshold conservativo)
    assert body[0]["similarity"] > 0.3


@pytest.mark.asyncio
async def test_search_marks_accessed(client: AsyncClient):
    """Dopo una ricerca, i chunk trovati hanno access_count > 0."""
    headers = await _auth_headers(client)
    
    create_response = await client.post(
        "/ai/memory",
        json={"content": "Felix il mio gatto", "kind": "fact"},
        headers=headers,
    )
    chunk_id = create_response.json()["id"]
    
    await client.post(
        "/ai/memory/search",
        json={"query": "animali", "limit": 5},
        headers=headers,
    )
    
    list_response = await client.get("/ai/memory", headers=headers)
    chunk = next(c for c in list_response.json() if c["id"] == chunk_id)
    assert chunk["access_count"] >= 1
    assert chunk["last_accessed_at"] is not None


@pytest.mark.asyncio
async def test_delete_memory_chunk(client: AsyncClient):
    headers = await _auth_headers(client)
    
    create = await client.post(
        "/ai/memory",
        json={"content": "Da eliminare", "kind": "fact"},
        headers=headers,
    )
    chunk_id = create.json()["id"]
    
    response = await client.delete(f"/ai/memory/{chunk_id}", headers=headers)
    assert response.status_code == 204
    
    list_response = await client.get("/ai/memory", headers=headers)
    chunks = list_response.json()
    assert not any(c["id"] == chunk_id for c in chunks)


@pytest.mark.asyncio
async def test_search_respects_user_isolation(client: AsyncClient):
    """Un utente non deve trovare i memory chunk di un altro."""
    headers_a = await _auth_headers(client)
    await client.post(
        "/ai/memory",
        json={"content": "Segreto di A", "kind": "fact"},
        headers=headers_a,
    )
    
    headers_b = await _auth_headers(client)
    response = await client.post(
        "/ai/memory/search",
        json={"query": "segreto", "limit": 5},
        headers=headers_b,
    )
    body = response.json()
    assert not any("Segreto di A" in r["chunk"]["content"] for r in body)