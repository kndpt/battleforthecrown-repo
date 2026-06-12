#!/usr/bin/env bash
# Runs on every Cursor Cloud agent boot (after snapshot restore).
# Keeps Postgres up; install/bootstrap is snapshotted via cursor-cloud-setup.sh.
set -euo pipefail

BFTC_REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export BFTC_REPO_ROOT
export PG_VERSION="${PG_VERSION:-16}"
export PG_CLUSTER="${PG_CLUSTER:-main}"

# shellcheck source=scripts/lib/bftc-cloud-postgres-native.sh
source "${BFTC_REPO_ROOT}/scripts/lib/bftc-cloud-postgres-native.sh"
bftc_cloud_postgres_native_ensure_running
