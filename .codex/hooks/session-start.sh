#!/usr/bin/env bash
set -euo pipefail

# SessionStart hook — Claude Code on the web.
# Adapté de scripts/codex-cloud-setup.sh : même stack, mais Postgres NATIF
# (le conteneur Claude web n'a pas de daemon Docker). Idempotent.

# Ne tourne que dans l'environnement distant (Claude Code on the web).
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
cd "$PROJECT_DIR"

# --- Variables d'environnement (mêmes valeurs que le setup Codex) ---
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/battleforthecrown}"
export JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET:-claude-dev-access-secret}"
export JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-claude-dev-refresh-secret}"
export PORT="${PORT:-15001}"
export FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
export VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://localhost:${PORT}}"
export VITE_WS_URL="${VITE_WS_URL:-http://localhost:${PORT}}"
export SMOKE_TEMPLATE_DB="${SMOKE_TEMPLATE_DB:-battleforthecrown_smoke}"

# Persiste les vars pour toute la session.
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  {
    echo "export DATABASE_URL=\"${DATABASE_URL}\""
    echo "export JWT_ACCESS_SECRET=\"${JWT_ACCESS_SECRET}\""
    echo "export JWT_REFRESH_SECRET=\"${JWT_REFRESH_SECRET}\""
    echo "export PORT=\"${PORT}\""
    echo "export FRONTEND_URL=\"${FRONTEND_URL}\""
    echo "export VITE_API_BASE_URL=\"${VITE_API_BASE_URL}\""
    echo "export VITE_WS_URL=\"${VITE_WS_URL}\""
    echo "export SMOKE_TEMPLATE_DB=\"${SMOKE_TEMPLATE_DB}\""
  } >> "$CLAUDE_ENV_FILE"
fi

# --- Postgres natif (pas de Docker) ---
PG_VERSION="${PG_VERSION:-16}"
PG_CLUSTER="${PG_CLUSTER:-main}"

if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
  pg_ctlcluster "$PG_VERSION" "$PG_CLUSTER" start >/dev/null 2>&1 || true
fi
until pg_isready -h localhost -p 5432 >/dev/null 2>&1; do
  sleep 1
done

# Rôle + bases (idempotent). psql via l'user OS postgres (peer auth socket).
runuser -u postgres -- psql -v ON_ERROR_STOP=1 \
  -c "ALTER USER postgres WITH PASSWORD 'postgres';" >/dev/null

ensure_db() {
  local db="$1"
  if [ "$(runuser -u postgres -- psql -tAc "SELECT 1 FROM pg_database WHERE datname='${db}'")" != "1" ]; then
    runuser -u postgres -- createdb "$db"
  fi
}
ensure_db battleforthecrown
ensure_db "$SMOKE_TEMPLATE_DB"

# --- Dépendances Node + build shared ---
corepack enable >/dev/null 2>&1 || true
yarn install --frozen-lockfile
yarn workspace battleforthecrown-backend prisma generate
yarn workspace @battleforthecrown/shared clean
yarn workspace @battleforthecrown/shared build

# --- Migrations + seed (DB principale puis template smoke) ---
yarn workspace battleforthecrown-backend prisma migrate deploy

PGPASSWORD=postgres psql "$DATABASE_URL" \
  < battleforthecrown-backend/prisma/seed-default-world-config.sql

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/${SMOKE_TEMPLATE_DB}" \
  yarn workspace battleforthecrown-backend prisma migrate deploy
