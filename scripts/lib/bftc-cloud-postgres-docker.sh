# shellcheck shell=bash

bftc_cloud_postgres_docker_ensure_running() {
  cd battleforthecrown-backend
  docker compose up -d
  cd ..

  until docker exec battleforthecrown-postgres pg_isready -U postgres -d battleforthecrown >/dev/null 2>&1; do
    sleep 1
  done
}

bftc_cloud_postgres_docker_ensure_databases() {
  if ! docker exec battleforthecrown-postgres \
    psql -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '${SMOKE_TEMPLATE_DB}'" \
    | grep -qx 1; then
    docker exec battleforthecrown-postgres \
      psql -U postgres -d postgres \
      -c "CREATE DATABASE ${SMOKE_TEMPLATE_DB};"
  fi
}

bftc_cloud_postgres_docker_bootstrap() {
  bftc_cloud_postgres_docker_ensure_running
  bftc_cloud_postgres_docker_ensure_databases
}
