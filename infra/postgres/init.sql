-- infra/postgres/init.sql
--
-- Eseguito automaticamente alla PRIMA creazione del database.
-- Crea le estensioni che useremo poi nelle migrations Alembic.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- per generare UUID
CREATE EXTENSION IF NOT EXISTS "vector";       -- pgvector per embeddings
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- ricerca testuale fuzzy
CREATE EXTENSION IF NOT EXISTS "citext";       -- testo case-insensitive (per email)
