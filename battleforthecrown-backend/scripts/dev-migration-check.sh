#!/usr/bin/env sh

set -eu

if [ "${BFTC_SKIP_DEV_MIGRATION_CHECK:-}" = "1" ]; then
  echo "[dev-migrate] Skipped via BFTC_SKIP_DEV_MIGRATION_CHECK=1."
  exit 0
fi

echo "[dev-migrate] Applying pending migrations..."
yarn -s prisma migrate deploy
echo "[dev-migrate] OK."
