"""
Configurazione pytest condivisa.

Le fixtures qui dichiarate sono disponibili in tutti i test del progetto.
"""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.db.session import engine


@pytest.fixture(scope="session")
def anyio_backend() -> str:
    """Dice a pytest-asyncio di usare asyncio (non trio)."""
    return "asyncio"


@pytest_asyncio.fixture
async def client() -> AsyncClient:
    """
    Client HTTP async che invia richieste direttamente all'app FastAPI
    senza passare per una rete vera (usa ASGITransport in-memory).
    
    Alla fine del test, smaltisce esplicitamente il pool di connessioni
    SQLAlchemy per evitare warning su task pendenti.
    
    Uso nei test:
        async def test_something(client: AsyncClient):
            r = await client.get("/health")
            assert r.status_code == 200
    """
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac
    
    # Cleanup: chiudi il pool di connessioni per evitare task pendenti
    await engine.dispose()