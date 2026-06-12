# shellcheck shell=bash

bftc_cloud_apply_migrations_and_seed() {
  local repo_root="${BFTC_REPO_ROOT:?BFTC_REPO_ROOT must be set}"
  local seed_sql="${repo_root}/battleforthecrown-backend/prisma/seed-default-world-config.sql"

  yarn workspace battleforthecrown-backend prisma migrate deploy

  case "${BFTC_POSTGRES_MODE:-native}" in
    docker)
      docker exec -i battleforthecrown-postgres \
        psql -U postgres -d battleforthecrown <"$seed_sql"
      ;;
    native | *)
      PGPASSWORD=postgres psql "$DATABASE_URL" <"$seed_sql"
      ;;
  esac

  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/${SMOKE_TEMPLATE_DB}" \
    yarn workspace battleforthecrown-backend prisma migrate deploy
}
