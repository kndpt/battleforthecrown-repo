#!/usr/bin/env bash
set -euo pipefail

cd "${CODEX_WORKTREE_PATH:-$(pwd)}"

corepack enable

export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/battleforthecrown}"
export JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET:-codex-dev-access-secret}"
export JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-codex-dev-refresh-secret}"
export PORT="${PORT:-15001}"
export FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
export VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://localhost:${PORT}}"
export VITE_WS_URL="${VITE_WS_URL:-http://localhost:${PORT}}"
export SMOKE_TEMPLATE_DB="${SMOKE_TEMPLATE_DB:-battleforthecrown_smoke}"

cat > "${HOME}/.bftc-codex-env" <<EOF
export DATABASE_URL="${DATABASE_URL}"
export JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET}"
export JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"
export PORT="${PORT}"
export FRONTEND_URL="${FRONTEND_URL}"
export VITE_API_BASE_URL="${VITE_API_BASE_URL}"
export VITE_WS_URL="${VITE_WS_URL}"
export SMOKE_TEMPLATE_DB="${SMOKE_TEMPLATE_DB}"
EOF

if ! grep -q 'source "${HOME}/.bftc-codex-env"' "${HOME}/.bashrc" 2>/dev/null; then
  printf '\nsource "${HOME}/.bftc-codex-env"\n' >> "${HOME}/.bashrc"
fi

yarn install --frozen-lockfile
yarn workspace battleforthecrown-backend prisma generate
yarn workspace @battleforthecrown/shared clean
yarn workspace @battleforthecrown/shared build

cd battleforthecrown-backend
docker compose up -d
cd ..

until docker exec battleforthecrown-postgres pg_isready -U postgres -d battleforthecrown >/dev/null 2>&1; do
  sleep 1
done

yarn workspace battleforthecrown-backend prisma migrate deploy

docker exec -i battleforthecrown-postgres \
  psql -U postgres -d battleforthecrown \
  < battleforthecrown-backend/prisma/seed-default-world-config.sql

if ! docker exec battleforthecrown-postgres \
  psql -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '${SMOKE_TEMPLATE_DB}'" \
  | grep -qx 1; then
  docker exec battleforthecrown-postgres \
    psql -U postgres -d postgres \
    -c "CREATE DATABASE ${SMOKE_TEMPLATE_DB};"
fi

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/${SMOKE_TEMPLATE_DB}" \
  yarn workspace battleforthecrown-backend prisma migrate deploy

yarn static-check
