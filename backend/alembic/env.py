"""
Configurazione di Alembic.

Questo file è eseguito ogni volta che lanci un comando alembic
(es. `alembic upgrade head`, `alembic revision --autogenerate`).

Punti chiave:
- Prendiamo l'URL del database dalle settings dell'app (no hardcoding)
- Usiamo l'engine async di SQLAlchemy
- Importiamo Base.metadata per l'autogenerate
"""

import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Importiamo le settings e la Base dei modelli
from app.config import settings
from app.db.base import Base

# Importiamo TUTTI i modelli per registrarli su Base.metadata.
# Nota: ora non c'è ancora niente, ma quando aggiungeremo modelli
# in app/models/ dovremo importarli qui (lo facciamo nel prossimo step).
from app.models import *  # noqa: F401, F403


# ============================================================
# Configurazione base
# ============================================================
config = context.config

# Configura il logging dal file alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Iniettiamo la URL del database dalle settings
# (Alembic vuole il dialetto sync per le offline migrations,
# ma noi useremo solo online migrations con async)
config.set_main_option("sqlalchemy.url", settings.database_url)

# Target metadata: la "fotografia" dei nostri modelli, usata
# da Alembic per fare il diff con lo schema attuale del DB.
target_metadata = Base.metadata


# ============================================================
# Migration ONLINE async
# ============================================================
def do_run_migrations(connection: Connection) -> None:
    """Esegue effettivamente le migration sulla connessione data."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        # Include i tipi di colonna nelle diff (utile per pgvector)
        compare_type=True,
        # Include i defaults del server nelle diff
        compare_server_default=True,
    )
    
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Crea un engine async e lancia le migration."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    
    await connectable.dispose()


def run_migrations_online() -> None:
    """Entry point per migration in modalità online (async)."""
    asyncio.run(run_async_migrations())


# ============================================================
# Migration OFFLINE (genera SQL senza connettersi al DB)
# Utile per produzione: generi SQL, lo fai vedere a un DBA,
# lui lo applica manualmente.
# ============================================================
def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    
    with context.begin_transaction():
        context.run_migrations()


# Decide quale modalità usare in base a come è stato chiamato Alembic
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()