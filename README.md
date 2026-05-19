# 🐷 MoneyBuddy

> Il tuo assistente finanziario personale con AI. Tieni traccia delle tue spese chattando in linguaggio naturale.

![MoneyBuddy](https://img.shields.io/badge/status-in%20development-orange) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688) ![Postgres](https://img.shields.io/badge/Postgres-16%20%2B%20pgvector-336791)

## Cosa fa

MoneyBuddy è una **PWA** (installabile su iPhone/Android) per tenere traccia delle tue finanze personali. Invece di compilare moduli, parli con un assistente AI che capisce frasi tipo:

> "Ho speso 28€ al ristorante stasera"

L'AI capisce, propone una transazione, tu confermi. Tutto qui.

## Tech stack

**Frontend**
- Next.js 16 (App Router) + React 19
- TypeScript + Tailwind v4
- TanStack Query per data fetching
- PWA installabile

**Backend**
- FastAPI + Python 3.12 (async)
- SQLAlchemy 2.0 + Alembic
- PostgreSQL 16 + pgvector (per RAG)
- Argon2id per le password, JWT per le sessioni

**AI**
- Google Gemini (gemini-2.5-flash) per chat e tool use
- Embedding gemini-embedding-001 per memoria a lungo termine

## Quick start (locale)

```bash
# 1. Database (Postgres + pgvector via Docker)
make up

# 2. Backend
cp backend/.env.example backend/.env
# Riempi GOOGLE_API_KEY in backend/.env
make migrate
make backend

# 3. Frontend (in un altro terminale)
cp frontend/.env.example frontend/.env.local
make frontend

# 4. Vai a http://localhost:3000
```

## Status

In sviluppo attivo. Roadmap: vedi [docs/roadmap.md](./docs/roadmap.md).

## Author

[@aminevln](https://github.com/aminevln)