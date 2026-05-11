#!/usr/bin/env sh
set -eu

DB_NAME="battleforthecrown_smoke"
SMOKE_URL="${SMOKE_DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/${DB_NAME}}"

if ! command -v docker >/dev/null 2>&1; then
  echo "[smoke-preflight] Docker CLI not found. Start Docker Desktop or skip smokes explicitly."
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx 'battleforthecrown-postgres'; then
  echo "[smoke-preflight] Container 'battleforthecrown-postgres' is not running."
  echo "[smoke-preflight] Start it with: cd battleforthecrown-backend && docker compose up -d"
  exit 1
fi

if ! docker exec battleforthecrown-postgres psql -U postgres -lqt \
  | cut -d '|' -f 1 \
  | grep -qw "${DB_NAME}"; then
  echo "[smoke-preflight] Smoke database '${DB_NAME}' is missing."
  echo "[smoke-preflight] Create/apply it via docs/architecture/db-setup.md § DB smoke."
  exit 1
fi

if ! output=$(DATABASE_URL="${SMOKE_URL}" yarn -s prisma migrate status 2>&1); then
  echo "[smoke-preflight] Smoke database migrations are not ready."
  echo "${output}"
  echo "[smoke-preflight] Fix: DATABASE_URL=\"${SMOKE_URL}\" yarn workspace battleforthecrown-backend prisma migrate deploy"
  exit 1
fi

echo "[smoke-preflight] OK: container, database and migrations are ready."
