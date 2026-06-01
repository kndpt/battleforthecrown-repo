#!/usr/bin/env sh

set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "${script_dir}/.."

echo "[dev-prereq] Building shared package..."
yarn -s workspace @battleforthecrown/shared build

echo "[dev-prereq] Generating Prisma client..."
yarn -s prisma generate

if [ "${BFTC_SKIP_DEV_MIGRATION_CHECK:-}" = "1" ]; then
  echo "[dev-migrate] Skipped via BFTC_SKIP_DEV_MIGRATION_CHECK=1."
  exit 0
fi

echo "[dev-migrate] Applying pending migrations..."
yarn -s prisma migrate deploy
echo "[dev-prereq] OK."
