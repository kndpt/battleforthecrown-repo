# shellcheck shell=bash

bftc_cloud_as_postgres() {
  if [ "$(id -u)" -eq 0 ]; then
    runuser -u postgres -- "$@"
  else
    sudo -u postgres "$@"
  fi
}

bftc_cloud_postgres_native_ctl() {
  if [ "$(id -u)" -eq 0 ]; then
    pg_ctlcluster "$PG_VERSION" "$PG_CLUSTER" "$@"
  else
    sudo pg_ctlcluster "$PG_VERSION" "$PG_CLUSTER" "$@"
  fi
}

bftc_cloud_postgres_native_ensure_running() {
  if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    bftc_cloud_postgres_native_ctl start >/dev/null 2>&1 || true
  fi
  until pg_isready -h localhost -p 5432 >/dev/null 2>&1; do
    sleep 1
  done
}

bftc_cloud_postgres_native_ensure_databases() {
  bftc_cloud_as_postgres psql -v ON_ERROR_STOP=1 \
    -c "ALTER USER postgres WITH PASSWORD 'postgres';" >/dev/null

  local db
  for db in battleforthecrown "${SMOKE_TEMPLATE_DB}"; do
    if [ "$(bftc_cloud_as_postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${db}'")" != "1" ]; then
      bftc_cloud_as_postgres createdb "$db"
    fi
  done
}

bftc_cloud_postgres_native_bootstrap() {
  bftc_cloud_postgres_native_ensure_running
  bftc_cloud_postgres_native_ensure_databases
}
