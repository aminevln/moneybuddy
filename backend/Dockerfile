# ============================================================
# MoneyBuddy Backend - Production Dockerfile
# ============================================================
# Build multi-stage per immagine finale piccola.
# 
# Stage 1: dependencies installer (con uv)
# Stage 2: runtime image (slim, copia solo .venv + codice)
# ============================================================

# ============================================================
# STAGE 1: builder
# ============================================================
FROM python:3.12-slim AS builder

# uv è il package manager ultra-veloce (10-100x più rapido di pip)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Cache layer per le dipendenze: copia SOLO i file di deps prima.
# Se cambia solo il codice, Docker riusa questo layer.
COPY pyproject.toml uv.lock* ./

# Install dipendenze in .venv (senza dev deps)
RUN uv sync --frozen --no-dev --no-install-project

# Ora copia il codice e installa il progetto stesso
COPY . .
RUN uv sync --frozen --no-dev

# ============================================================
# STAGE 2: runtime
# ============================================================
FROM python:3.12-slim AS runtime

# Pacchetti di sistema runtime (curl per healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia solo il virtual environment + codice dal builder
COPY --from=builder /app /app

# Aggiungi .venv al PATH così "uvicorn" si trova senza prefisso
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Railway esporta automaticamente PORT — fallback a 8000 per dev locale
ENV PORT=8000

# Healthcheck: Railway/Docker controllano se l'app risponde
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

# Espone la porta (documentazione, Railway gestisce comunque)
EXPOSE 8000

# Comando di avvio: uvicorn senza --reload, su PORT dinamica
# NB: usiamo sh -c per espandere $PORT
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]