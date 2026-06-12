#!/usr/bin/env bash
set -euo pipefail

BFTC_REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$BFTC_REPO_ROOT"

export BFTC_REPO_ROOT
export BFTC_CLOUD_RUNTIME="${BFTC_CLOUD_RUNTIME:-cursor}"
export BFTC_POSTGRES_MODE="${BFTC_POSTGRES_MODE:-native}"

# shellcheck source=scripts/lib/bftc-cloud-bootstrap.sh
source "${BFTC_REPO_ROOT}/scripts/lib/bftc-cloud-bootstrap.sh"
bftc_cloud_bootstrap true
