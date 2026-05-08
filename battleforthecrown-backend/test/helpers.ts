import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type PgBoss from 'pg-boss';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { SMOKE_WORLD_CONFIG } from './fixtures/smoke-world-config';

export interface SmokeContext {
  app: INestApplication;
  prisma: PrismaService;
  boss: PgBoss;
  server: ReturnType<INestApplication['getHttpServer']>;
}

export async function bootSmokeApp(): Promise<SmokeContext> {
  const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleFixture.createNestApplication();
  await app.init();
  return {
    app,
    prisma: app.get(PrismaService),
    boss: app.get<PgBoss>('PG_BOSS'),
    server: app.getHttpServer(),
  };
}

const TABLES = [
  'expedition', 'combat_report', 'unit_training', 'unit_inventory',
  'building', 'population', 'resource_stock', 'village', 'village_strategy_config',
  'event_outbox', 'power_snapshot', 'zone_capacity', 'chunk_spawn_state',
  'world_seed_state', 'world_entity', 'crown_balance', 'world_membership',
  'world', 'session', '"user"',
];

export async function truncateAll(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${TABLES.join(', ')} RESTART IDENTITY CASCADE`);
}

export async function seedSmokeWorld(
  prisma: PrismaService,
  id = `smoke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
) {
  return prisma.world.create({
    data: { id, name: id, status: 'OPEN', config: SMOKE_WORLD_CONFIG as object },
  });
}

type Server = SmokeContext['server'];

export async function registerUser(server: Server, suffix?: string) {
  const tag = suffix ?? `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const email = `smoke-${tag}@test.local`;
  const password = 'smoke-password-123';
  const res = await request(server).post('/auth/register').send({ email, password });
  if (res.status >= 300) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body as { accessToken: string; refreshToken: string; userId: string; email: string };
}

export async function joinWorld(
  server: Server,
  accessToken: string,
  worldId: string,
  villageName: string,
) {
  const res = await request(server)
    .post(`/world/${worldId}/join`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ villageName });
  if (res.status >= 300) throw new Error(`join failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body;
}

export interface WaitOpts { timeoutMs?: number; intervalMs?: number }

export async function waitFor<T>(
  predicate: () => Promise<T | null | undefined | false>,
  opts: WaitOpts = {},
): Promise<T> {
  const timeout = opts.timeoutMs ?? 5000;
  const interval = opts.intervalMs ?? 50;
  const start = Date.now();
  let lastError: unknown;
  while (Date.now() - start < timeout) {
    try {
      const value = await predicate();
      if (value) return value;
    } catch (err) {
      lastError = err;
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error(`waitFor timed out after ${timeout}ms${lastError ? ` (last error: ${String(lastError)})` : ''}`);
}

export async function outboxDispatched(
  prisma: PrismaService,
  where: { kind: string; aggregateId?: string },
  opts?: WaitOpts,
) {
  return waitFor(
    () => prisma.eventOutbox.findFirst({ where: { ...where, dispatchedAt: { not: null } } }),
    opts,
  );
}
