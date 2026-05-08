process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.SMOKE_DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/battleforthecrown_smoke';
process.env.JWT_ACCESS_SECRET ??= 'smoke-access-secret-must-be-at-least-32-chars-long';
process.env.JWT_REFRESH_SECRET ??= 'smoke-refresh-secret-must-be-at-least-32-chars-long';
// Push the production cron far away — smokes trigger ticks manually via boss.send
process.env.PRODUCTION_TICK_INTERVAL_MINUTES = '999';
