#!/usr/bin/env bash
# Démarre back + front accessibles depuis un autre appareil sur le même wifi.
# Détecte l'IP LAN automatiquement (override possible via LAN_IP=x.x.x.x).
set -euo pipefail

LAN_IP="${LAN_IP:-$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)}"
if [ -z "$LAN_IP" ]; then
  echo "❌ IP LAN introuvable (en0/en1). Relance avec LAN_IP=192.168.x.x yarn dev:lan" >&2
  exit 1
fi

FRONT_PORT="${FRONT_PORT:-5173}"
BACK_PORT="${BACK_PORT:-15001}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

printf '\n  ▶ Accès LAN (même wifi)\n  ▶ Frontend  http://%s:%s\n  ▶ Backend   http://%s:%s\n\n' \
  "$LAN_IP" "$FRONT_PORT" "$LAN_IP" "$BACK_PORT"

exec concurrently -n front,back -c magenta,blue -k \
  "cd '$ROOT/battleforthecrown-pixi' && VITE_API_BASE_URL=http://${LAN_IP}:${BACK_PORT} VITE_WS_URL=http://${LAN_IP}:${BACK_PORT} exec node_modules/.bin/vite --host --port ${FRONT_PORT} --strictPort" \
  "cd '$ROOT/battleforthecrown-backend' && scripts/dev-migration-check.sh && FRONTEND_URL=http://${LAN_IP}:${FRONT_PORT} PORT=${BACK_PORT} exec node_modules/.bin/nest start --watch"
