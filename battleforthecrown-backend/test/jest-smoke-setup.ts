process.env.NODE_ENV = 'test';

// Each Jest worker gets its own database clone created by smoke-preflight.sh
// (`battleforthecrown_smoke_w1`, `_w2`, …). Setting DATABASE_URL here, before
// any Nest module loads, ensures Prisma + pg-boss bind to the right clone.
const workerId = process.env.JEST_WORKER_ID || '1';
const templateDb = process.env.SMOKE_TEMPLATE_DB || 'battleforthecrown_smoke';
process.env.DATABASE_URL =
  process.env.SMOKE_DATABASE_URL ??
  `postgresql://postgres:postgres@localhost:5432/${templateDb}_w${workerId}`;
process.env.JWT_ACCESS_SECRET ??=
  'smoke-access-secret-must-be-at-least-32-chars-long';
process.env.JWT_REFRESH_SECRET ??=
  'smoke-refresh-secret-must-be-at-least-32-chars-long';
// Compress worker latency for smokes: chained pg-boss jobs (training, combat,
// return…) are picked up one poll cycle apart — drop from the 2s default to the
// 500ms pg-boss floor — and the Outbox dispatcher polls 4× faster. Prod/dev keep
// their defaults (these env vars are unset there). See queue-worker.helper.ts.
process.env.PGBOSS_WORKER_POLL_MS ??= '500';
process.env.OUTBOX_POLL_INTERVAL ??= '250';
// Default 60-min cron means no spontaneous tick during a ~30s suite — smokes
// trigger production ticks manually via boss.send('production:tick', {}).
