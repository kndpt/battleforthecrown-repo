# shellcheck shell=bash

bftc_cloud_install_node_tooling() {
  corepack enable >/dev/null 2>&1 || true
  yarn install --frozen-lockfile
  yarn workspace battleforthecrown-backend prisma generate
  yarn workspace @battleforthecrown/shared clean
  yarn workspace @battleforthecrown/shared build
}

bftc_cloud_run_static_check() {
  yarn static-check
}
