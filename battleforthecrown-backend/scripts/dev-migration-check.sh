#!/usr/bin/env sh

set -eu

if [ "${BFTC_SKIP_DEV_MIGRATION_CHECK:-}" = "1" ]; then
  echo "[dev-migration-check] Skipped via BFTC_SKIP_DEV_MIGRATION_CHECK=1."
  exit 0
fi

if ! output=$(yarn -s prisma migrate status 2>&1); then
  echo "[dev-migration-check] Database migrations are not ready."
  echo "${output}"
  echo "[dev-migration-check] Fix: yarn workspace battleforthecrown-backend prisma migrate deploy"
  exit 1
fi

echo "[dev-migration-check] OK: database migrations are ready."
