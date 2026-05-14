#!/usr/bin/env sh
set -eu

# Smoke DB strategy: a single Postgres container hosts:
#   - one TEMPLATE database with the migrations applied (battleforthecrown_smoke)
#   - N per-worker clones (battleforthecrown_smoke_w1, _w2, ...) created via
#     `CREATE DATABASE ... TEMPLATE battleforthecrown_smoke`
# Each Jest worker connects to its own clone (see test/jest-smoke-setup.ts).
# Preflight (re)creates the clones from the template so every run starts fresh.

TEMPLATE_DB="${SMOKE_TEMPLATE_DB:-battleforthecrown_smoke}"
WORKERS="${SMOKE_WORKERS:-8}"
TEMPLATE_URL="postgresql://postgres:postgres@localhost:5432/${TEMPLATE_DB}"

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
  | grep -qw "${TEMPLATE_DB}"; then
  echo "[smoke-preflight] Template database '${TEMPLATE_DB}' is missing."
  echo "[smoke-preflight] Create/apply it via docs/architecture/db-setup.md § DB smoke."
  exit 1
fi

if ! output=$(DATABASE_URL="${TEMPLATE_URL}" yarn -s prisma migrate status 2>&1); then
  echo "[smoke-preflight] Template migrations are not up to date."
  echo "${output}"
  echo "[smoke-preflight] Fix: DATABASE_URL=\"${TEMPLATE_URL}\" yarn workspace battleforthecrown-backend prisma migrate deploy"
  exit 1
fi

# Drop any pg-boss residue from the template so clones start without queues.
docker exec battleforthecrown-postgres psql -U postgres -d "${TEMPLATE_DB}" -v ON_ERROR_STOP=1 -c \
  "DROP SCHEMA IF EXISTS pgboss CASCADE;" >/dev/null

i=1
while [ "${i}" -le "${WORKERS}" ]; do
  WORKER_DB="${TEMPLATE_DB}_w${i}"
  docker exec battleforthecrown-postgres psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
    -c "DROP DATABASE IF EXISTS ${WORKER_DB} WITH (FORCE);" \
    -c "CREATE DATABASE ${WORKER_DB} TEMPLATE ${TEMPLATE_DB};" >/dev/null
  i=$((i + 1))
done

echo "[smoke-preflight] OK: template '${TEMPLATE_DB}' migrated, ${WORKERS} fresh worker clones ready."
