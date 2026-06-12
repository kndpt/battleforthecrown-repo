# shellcheck shell=bash
# Shared dev env defaults for remote cloud harnesses (Codex, Claude web, Cursor).

bftc_cloud_jwt_prefix() {
  case "${BFTC_CLOUD_RUNTIME:-cursor}" in
    codex) echo codex ;;
    claude) echo claude ;;
    cursor) echo cursor ;;
    *) echo cloud ;;
  esac
}

bftc_cloud_export_defaults() {
  local prefix
  prefix="$(bftc_cloud_jwt_prefix)"

  export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/battleforthecrown}"
  export JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET:-${prefix}-dev-access-secret}"
  export JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-${prefix}-dev-refresh-secret}"
  export PORT="${PORT:-15001}"
  export FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
  export VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://localhost:${PORT}}"
  export VITE_WS_URL="${VITE_WS_URL:-http://localhost:${PORT}}"
  export SMOKE_TEMPLATE_DB="${SMOKE_TEMPLATE_DB:-battleforthecrown_smoke}"
  export PG_VERSION="${PG_VERSION:-16}"
  export PG_CLUSTER="${PG_CLUSTER:-main}"
}

bftc_cloud_persist_shell_env() {
  case "${BFTC_CLOUD_RUNTIME:-cursor}" in
    claude)
      if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
        {
          echo "export DATABASE_URL=\"${DATABASE_URL}\""
          echo "export JWT_ACCESS_SECRET=\"${JWT_ACCESS_SECRET}\""
          echo "export JWT_REFRESH_SECRET=\"${JWT_REFRESH_SECRET}\""
          echo "export PORT=\"${PORT}\""
          echo "export FRONTEND_URL=\"${FRONTEND_URL}\""
          echo "export VITE_API_BASE_URL=\"${VITE_API_BASE_URL}\""
          echo "export VITE_WS_URL=\"${VITE_WS_URL}\""
          echo "export SMOKE_TEMPLATE_DB=\"${SMOKE_TEMPLATE_DB}\""
        } >>"$CLAUDE_ENV_FILE"
      fi
      ;;
    codex)
      cat >"${HOME}/.bftc-codex-env" <<EOF
export DATABASE_URL="${DATABASE_URL}"
export JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET}"
export JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"
export PORT="${PORT}"
export FRONTEND_URL="${FRONTEND_URL}"
export VITE_API_BASE_URL="${VITE_API_BASE_URL}"
export VITE_WS_URL="${VITE_WS_URL}"
export SMOKE_TEMPLATE_DB="${SMOKE_TEMPLATE_DB}"
EOF
      if ! grep -q 'source "${HOME}/.bftc-codex-env"' "${HOME}/.bashrc" 2>/dev/null; then
        printf '\nsource "${HOME}/.bftc-codex-env"\n' >>"${HOME}/.bashrc"
      fi
      ;;
    cursor | *)
      cat >"${HOME}/.bftc-cloud-env" <<EOF
export DATABASE_URL="${DATABASE_URL}"
export JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET}"
export JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"
export PORT="${PORT}"
export FRONTEND_URL="${FRONTEND_URL}"
export VITE_API_BASE_URL="${VITE_API_BASE_URL}"
export VITE_WS_URL="${VITE_WS_URL}"
export SMOKE_TEMPLATE_DB="${SMOKE_TEMPLATE_DB}"
EOF
      if ! grep -q 'source "${HOME}/.bftc-cloud-env"' "${HOME}/.bashrc" 2>/dev/null; then
        printf '\nsource "${HOME}/.bftc-cloud-env"\n' >>"${HOME}/.bashrc"
      fi
      ;;
  esac
}
