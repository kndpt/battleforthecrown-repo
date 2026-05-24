#!/usr/bin/env bash
# Garbage-collect ephemeral BFTC databases.
# Drops every `battleforthecrown_*` DB (except the canonical `battleforthecrown`)
# that has no active connections and whose data directory was last modified
# > THRESHOLD ago. The `base/<oid>` mtime advances with any write activity
# (WAL flushes, checkpoints, queries that dirty pages), so an idle orphan DB
# has a stale mtime while an in-use DB stays "warm".

set -euo pipefail

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
export PGPASSWORD="${PGPASSWORD:-postgres}"

PROTECTED_DB="battleforthecrown"
THRESHOLD_HOURS="${BFTC_DB_GC_HOURS:-24}"

LOG_PREFIX="[bftc-db-gc $(date '+%Y-%m-%d %H:%M:%S')]"

candidates=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -tA <<SQL
SELECT d.datname
FROM pg_database d,
     LATERAL pg_stat_file('base/' || d.oid) f
WHERE d.datname LIKE 'battleforthecrown_%'
  AND d.datname <> '${PROTECTED_DB}'
  AND f.modification < NOW() - INTERVAL '${THRESHOLD_HOURS} hours'
  AND NOT EXISTS (
    SELECT 1 FROM pg_stat_activity a
    WHERE a.datname = d.datname
  )
ORDER BY d.datname;
SQL
)

if [[ -z "$candidates" ]]; then
  echo "$LOG_PREFIX nothing to drop (threshold=${THRESHOLD_HOURS}h)"
  exit 0
fi

echo "$LOG_PREFIX candidates:"
echo "$candidates" | sed 's/^/  - /'

while IFS= read -r db; do
  [[ -z "$db" ]] && continue
  if dropdb -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" --if-exists --force "$db"; then
    echo "$LOG_PREFIX dropped: $db"
  else
    echo "$LOG_PREFIX FAILED: $db" >&2
  fi
done <<<"$candidates"
