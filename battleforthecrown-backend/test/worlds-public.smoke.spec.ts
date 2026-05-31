import request from 'supertest';
import { PublicWorldsResponseSchema } from '@battleforthecrown/shared/world';
import { WorldLifecycleWorker } from '../src/workers/world-lifecycle.worker';
import { bootSmokeApp, type SmokeContext } from './helpers';
import { SMOKE_WORLD_CONFIG } from './fixtures/smoke-world-config';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe('public worlds smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  beforeEach(async () => {
    await ctx.prisma.eventOutbox.deleteMany();
    await ctx.prisma.worldMembership.deleteMany();
    await ctx.prisma.world.deleteMany();
    await ctx.prisma.user.deleteMany({
      where: { email: { endsWith: '@smoke.local' } },
    });
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('GET /worlds/public returns planned, open main, open late and locked worlds with lifecycle metadata', async () => {
    const now = new Date();
    await seedWorld('planned-public', 'PLANNED', {
      plannedOpenAt: addDays(now, 2),
      identityDisplayName: 'Aubeforge',
    });
    await seedWorld('open-main-public', 'OPEN', {
      startedAt: addDays(now, -2),
      endsAt: addDays(now, 58),
      identityDisplayName: 'Brumeval',
      memberships: 2,
    });
    await seedWorld('open-late-public', 'OPEN', {
      startedAt: addDays(now, -8),
      endsAt: addDays(now, 52),
      identityDisplayName: 'Clairbois',
    });
    await seedWorld('locked-public', 'LOCKED', {
      startedAt: addDays(now, -11),
      endsAt: addDays(now, 49),
      identityDisplayName: 'Dornefer',
    });
    await seedWorld('custom-tempo-public', 'OPEN', {
      startedAt: addDays(now, -1),
      endsAt: addDays(now, 59),
      tempoGlobal: 0.5,
    });
    await seedWorld('ended-public', 'ENDED', {
      startedAt: addDays(now, -61),
      endsAt: addDays(now, -1),
      identityDisplayName: 'Finis',
    });

    const res = await request(ctx.server).get('/worlds/public');

    expect(res.status).toBe(200);
    const worlds = PublicWorldsResponseSchema.parse(res.body);
    expect(worlds.map((world) => world.id).sort()).toEqual(
      [
        'locked-public',
        'custom-tempo-public',
        'open-late-public',
        'open-main-public',
        'planned-public',
      ].sort(),
    );

    const byId = new Map(worlds.map((world) => [world.id, world]));
    expect(byId.get('planned-public')).toMatchObject({
      status: 'PLANNED',
      identity: { displayName: 'Aubeforge', tier: 'DEBUTANTS' },
      lifecycle: {
        day: null,
        totalDays: 60,
        inscriptionMainDays: 7,
        inscriptionLateDays: 3,
        inscriptionPhase: 'closed',
        plannedOpenAt: addDays(now, 2).toISOString(),
      },
      map: { width: 500, height: 500 },
      tempoProfile: 'standard',
      joinedCount: 0,
    });
    expect(byId.get('open-main-public')).toMatchObject({
      lifecycle: { day: 3, inscriptionPhase: 'main' },
      joinedCount: 2,
    });
    expect(byId.get('open-late-public')).toMatchObject({
      lifecycle: { day: 9, inscriptionPhase: 'late' },
    });
    expect(byId.get('locked-public')).toMatchObject({
      lifecycle: {
        day: 12,
        inscriptionPhase: 'closed',
        plannedOpenAt: null,
      },
    });
    expect(byId.get('custom-tempo-public')).toMatchObject({
      tempoProfile: 'custom',
    });
  });

  it('WorldLifecycleWorker transitions due worlds once and skips premature worlds', async () => {
    const now = new Date('2026-02-01T00:00:00.000Z');
    await seedWorld('planned-due', 'PLANNED', {
      plannedOpenAt: addDays(now, -1),
    });
    await seedWorld('open-expired-registration', 'OPEN', {
      startedAt: addDays(now, -10),
      endsAt: addDays(now, 50),
    });
    await seedWorld('locked-expired', 'LOCKED', {
      startedAt: addDays(now, -60),
      endsAt: addDays(now, -1),
    });
    await seedWorld('planned-future', 'PLANNED', {
      plannedOpenAt: addDays(now, 1),
    });
    await seedWorld('open-still-main', 'OPEN', {
      startedAt: addDays(now, -2),
      endsAt: addDays(now, 58),
    });

    const worker = ctx.app.get(WorldLifecycleWorker);
    await expect(worker.handleLifecycleTick(now)).resolves.toEqual({
      plannedToOpen: 1,
      openToLocked: 1,
      lockedToEnded: 1,
    });

    const statuses = await ctx.prisma.world.findMany({
      where: {
        id: {
          in: [
            'planned-due',
            'open-expired-registration',
            'locked-expired',
            'planned-future',
            'open-still-main',
          ],
        },
      },
      select: {
        id: true,
        status: true,
        startedAt: true,
        endsAt: true,
        plannedOpenAt: true,
      },
    });
    expect(Object.fromEntries(statuses.map((w) => [w.id, w.status]))).toEqual({
      'planned-due': 'OPEN',
      'open-expired-registration': 'LOCKED',
      'locked-expired': 'ENDED',
      'planned-future': 'PLANNED',
      'open-still-main': 'OPEN',
    });
    expect(statuses.find((w) => w.id === 'planned-due')?.startedAt).toEqual(
      now,
    );
    expect(statuses.find((w) => w.id === 'planned-due')?.endsAt).toEqual(
      addDays(now, 60),
    );
    expect(
      statuses.find((w) => w.id === 'planned-due')?.plannedOpenAt,
    ).toBeNull();

    await expect(worker.handleLifecycleTick(now)).resolves.toEqual({
      plannedToOpen: 0,
      openToLocked: 0,
      lockedToEnded: 0,
    });

    const events = await ctx.prisma.eventOutbox.findMany({
      where: { kind: 'world.status.changed' },
      orderBy: { aggregateId: 'asc' },
    });
    expect(events).toHaveLength(3);
    expect(events.map((event) => event.aggregateId).sort()).toEqual([
      'locked-expired',
      'open-expired-registration',
      'planned-due',
    ]);
  });

  async function seedWorld(
    id: string,
    status: 'PLANNED' | 'OPEN' | 'LOCKED' | 'ENDED',
    opts: {
      startedAt?: Date;
      endsAt?: Date;
      plannedOpenAt?: Date;
      identityDisplayName?: string;
      memberships?: number;
      tempoGlobal?: number;
    } = {},
  ) {
    const world = await ctx.prisma.world.create({
      data: {
        id,
        name: id,
        status,
        startedAt: opts.startedAt,
        endsAt: opts.endsAt,
        plannedOpenAt: opts.plannedOpenAt,
        config: {
          ...SMOKE_WORLD_CONFIG,
          tempo: {
            ...SMOKE_WORLD_CONFIG.tempo,
            global: opts.tempoGlobal ?? SMOKE_WORLD_CONFIG.tempo.global,
          },
          identity: {
            ...SMOKE_WORLD_CONFIG.identity,
            displayName: opts.identityDisplayName ?? id,
          },
        },
      },
    });

    for (let i = 0; i < (opts.memberships ?? 0); i++) {
      const user = await ctx.prisma.user.create({
        data: {
          email: `${id}-${i}@smoke.local`,
          password: 'hashed-password',
        },
      });
      await ctx.prisma.worldMembership.create({
        data: { userId: user.id, worldId: world.id },
      });
    }

    return world;
  }
});

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}
