#!/usr/bin/env bash
set -euo pipefail

# SessionStart hook — Claude Code on the web.
# Postgres natif (pas de Docker). Idempotent.

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

BFTC_REPO_ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
cd "$BFTC_REPO_ROOT"

export BFTC_REPO_ROOT
export BFTC_CLOUD_RUNTIME=claude
export BFTC_POSTGRES_MODE=native

# shellcheck source=scripts/lib/bftc-cloud-bootstrap.sh
source "${BFTC_REPO_ROOT}/scripts/lib/bftc-cloud-bootstrap.sh"
bftc_cloud_bootstrap false
