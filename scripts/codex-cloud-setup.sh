#!/usr/bin/env bash
set -euo pipefail

cd "${CODEX_WORKTREE_PATH:-$(pwd)}"
export BFTC_REPO_ROOT="$(pwd)"
export BFTC_CLOUD_RUNTIME=codex
export BFTC_POSTGRES_MODE=docker

# shellcheck source=scripts/lib/bftc-cloud-bootstrap.sh
source "${BFTC_REPO_ROOT}/scripts/lib/bftc-cloud-bootstrap.sh"
bftc_cloud_bootstrap true
