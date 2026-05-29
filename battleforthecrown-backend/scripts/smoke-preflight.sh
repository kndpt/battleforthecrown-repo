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
PG_CONTAINER="${SMOKE_PG_CONTAINER:-battleforthecrown-postgres}"

# Reach Postgres two ways: the Docker container (local dev) or a native server
# (Claude Code web env runs Postgres natively, with no Docker daemon).
if command -v docker >/dev/null 2>&1 \
  && docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "${PG_CONTAINER}"; then
  PG_MODE="docker"
elif command -v psql >/dev/null 2>&1 && pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
  PG_MODE="native"
else
  echo "[smoke-preflight] No Postgres backend reachable on localhost:5432."
  echo "[smoke-preflight] Docker: cd battleforthecrown-backend && docker compose up -d"
  echo "[smoke-preflight] Native: start a local Postgres server (see docs/architecture/db-setup.md § DB smoke)."
  exit 1
fi

# psql wrapper: routes through the container or a native server transparently.
pg_psql() {
  if [ "${PG_MODE}" = "docker" ]; then
    docker exec "${PG_CONTAINER}" psql -U postgres "$@"
  else
    PGPASSWORD="${PGPASSWORD:-postgres}" psql -h localhost -p 5432 -U postgres "$@"
  fi
}

if ! pg_psql -lqt \
  | cut -d '|' -f 1 \
  | grep -qw "${TEMPLATE_DB}"; then
  echo "[smoke-preflight] Template database '${TEMPLATE_DB}' is missing."
  echo "[smoke-preflight] Create/apply it via docs/architecture/db-setup.md § DB smoke."
  exit 1
fi

if ! output=$(DATABASE_URL="${TEMPLATE_URL}" yarn --silent workspace battleforthecrown-backend prisma migrate status 2>&1); then
  echo "[smoke-preflight] Template migrations are not up to date."
  echo "${output}"
  echo "[smoke-preflight] Fix: DATABASE_URL=\"${TEMPLATE_URL}\" yarn workspace battleforthecrown-backend prisma migrate deploy"
  exit 1
fi

# Drop any pg-boss residue from the template so clones start without queues.
pg_psql -d "${TEMPLATE_DB}" -v ON_ERROR_STOP=1 -c \
  "DROP SCHEMA IF EXISTS pgboss CASCADE;" >/dev/null

i=1
while [ "${i}" -le "${WORKERS}" ]; do
  WORKER_DB="${TEMPLATE_DB}_w${i}"
  pg_psql -d postgres -v ON_ERROR_STOP=1 \
    -c "DROP DATABASE IF EXISTS ${WORKER_DB} WITH (FORCE);" \
    -c "CREATE DATABASE ${WORKER_DB} TEMPLATE ${TEMPLATE_DB};" >/dev/null
  i=$((i + 1))
done

echo "[smoke-preflight] OK (${PG_MODE}): template '${TEMPLATE_DB}' migrated, ${WORKERS} fresh worker clones ready."
