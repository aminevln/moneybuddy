# Makefile - scorciatoie per i comandi più usati
#
# Uso: dalla root del progetto digita `make <comando>`
# Es.: make up, make down, make logs, make psql

COMPOSE = docker compose -f infra/docker-compose.yml

.PHONY: help up down restart logs ps psql redis-cli clean backend backend-shell migrate migration migration-empty migration-down migration-history frontend test

help:  ## Mostra questo aiuto
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

up:  ## Avvia tutti i servizi in background
	$(COMPOSE) up -d

down:  ## Ferma e rimuove i container (i dati restano)
	$(COMPOSE) down

restart:  ## Riavvia i container
	$(COMPOSE) restart

logs:  ## Mostra i log di tutti i servizi (Ctrl+C per uscire)
	$(COMPOSE) logs -f

ps:  ## Mostra lo stato dei container
	$(COMPOSE) ps

psql:  ## Apre una shell psql dentro il container Postgres
	$(COMPOSE) exec postgres psql -U moneybuddy -d moneybuddy

redis-cli:  ## Apre una shell Redis
	$(COMPOSE) exec redis redis-cli

clean:  ## ATTENZIONE: ferma tutto e cancella anche i volumi (perdi i dati DB)
	$(COMPOSE) down -v

backend:  ## Avvia il backend FastAPI in modalità dev
	cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

backend-shell:  ## Apre una shell Python dentro il virtual environment del backend
	cd backend && uv run python

frontend:  ## Avvia il frontend Next.js in dev mode
	cd frontend && pnpm dev

test:  ## Esegue tutti i test del backend
	cd backend && uv run pytest -v