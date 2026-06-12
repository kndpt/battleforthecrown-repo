# shellcheck shell=bash
# Orchestrates the shared remote cloud harness bootstrap.

_bftc_cloud_lib_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=scripts/lib/bftc-cloud-env.sh
source "${_bftc_cloud_lib_dir}/bftc-cloud-env.sh"
# shellcheck source=scripts/lib/bftc-cloud-node.sh
source "${_bftc_cloud_lib_dir}/bftc-cloud-node.sh"
# shellcheck source=scripts/lib/bftc-cloud-db.sh
source "${_bftc_cloud_lib_dir}/bftc-cloud-db.sh"
# shellcheck source=scripts/lib/bftc-cloud-postgres-native.sh
source "${_bftc_cloud_lib_dir}/bftc-cloud-postgres-native.sh"
# shellcheck source=scripts/lib/bftc-cloud-postgres-docker.sh
source "${_bftc_cloud_lib_dir}/bftc-cloud-postgres-docker.sh"

bftc_cloud_bootstrap() {
  local run_static_check="${1:-true}"

  bftc_cloud_export_defaults
  bftc_cloud_persist_shell_env
  bftc_cloud_install_node_tooling

  case "${BFTC_POSTGRES_MODE:-native}" in
    docker) bftc_cloud_postgres_docker_bootstrap ;;
    native | *) bftc_cloud_postgres_native_bootstrap ;;
  esac

  bftc_cloud_apply_migrations_and_seed

  if [ "$run_static_check" = true ]; then
    bftc_cloud_run_static_check
  fi
}
