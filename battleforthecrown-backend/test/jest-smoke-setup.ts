process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.SMOKE_DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/battleforthecrown_smoke';
process.env.JWT_ACCESS_SECRET ??= 'smoke-access-secret-must-be-at-least-32-chars-long';
process.env.JWT_REFRESH_SECRET ??= 'smoke-refresh-secret-must-be-at-least-32-chars-long';
// Default 60-min cron means no spontaneous tick during a ~30s suite — smokes
// trigger production ticks manually via boss.send('production:tick', {}).
