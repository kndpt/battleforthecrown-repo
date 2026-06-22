import { WorldLifecycleWorker } from '../src/workers/world-lifecycle.worker';
import { bootSmokeApp, type SmokeContext } from './helpers';
import { SMOKE_WORLD_CONFIG } from './fixtures/smoke-world-config';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Spawner de mondes (run 064) : le worker lifecycle garantit qu'un monde
 * joignable « frais » existe toujours pour les latecomers (cadence
 * `newWorldEverydays`, default 7j). Vérifie les 3 chemins : cadence échue,
 * cadence non échue (cas négatif), bootstrap DB vide.
 */
describe('world lifecycle spawner smoke', () => {
  let ctx: SmokeContext;
  let worker: WorldLifecycleWorker;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
    worker = ctx.app.get(WorldLifecycleWorker);
  });

  beforeEach(async () => {
    await ctx.prisma.eventOutbox.deleteMany();
    await ctx.prisma.worldMembership.deleteMany();
    await ctx.prisma.world.deleteMany();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  async function seedStartedWorld(id: string, startedDaysAgo: number) {
    const now = Date.now();
    await ctx.prisma.world.create({
      data: {
        id,
        name: id,
        status: 'OPEN',
        startedAt: new Date(now - startedDaysAgo * MS_PER_DAY),
        endsAt: new Date(now + (60 - startedDaysAgo) * MS_PER_DAY),
        config: SMOKE_WORLD_CONFIG,
      },
    });
  }

  it('(a) cadence elapsed → creates+opens a fresh world in the same tick, no duplicate on re-tick', async () => {
    await seedStartedWorld('spawner-open-8d', 8); // > cadence 7j, no PLANNED
    const now = new Date();

    const first = await worker.handleLifecycleTick(now);
    expect(first.plannedCreated).toBe(1);

    // No PLANNED world remains: the fresh world was opened in the same tick.
    const plannedAfter = await ctx.prisma.world.count({
      where: { status: 'PLANNED' },
    });
    expect(plannedAfter).toBe(0);
    const fresh = await ctx.prisma.world.findMany({
      where: { id: { not: 'spawner-open-8d' } },
    });
    expect(fresh).toHaveLength(1);
    expect(fresh[0].status).toBe('OPEN');
    expect(fresh[0].startedAt).toEqual(now);

    const events = await ctx.prisma.eventOutbox.findMany({
      where: { kind: 'world.planned.created' },
    });
    expect(events).toHaveLength(1);
    expect(events[0].aggregateId).toBe(fresh[0].id);

    // Idempotence: a second close tick does not create a second world.
    const second = await worker.handleLifecycleTick(now);
    expect(second.plannedCreated).toBe(0);
    expect(await ctx.prisma.world.count()).toBe(2);
    expect(
      await ctx.prisma.eventOutbox.count({
        where: { kind: 'world.planned.created' },
      }),
    ).toBe(1);
  });

  it('(b) cadence not elapsed → creates nothing', async () => {
    await seedStartedWorld('spawner-open-3d', 3); // < cadence 7j
    const now = new Date();

    const result = await worker.handleLifecycleTick(now);
    expect(result.plannedCreated).toBe(0);
    expect(await ctx.prisma.world.count()).toBe(1);
    expect(
      await ctx.prisma.eventOutbox.count({
        where: { kind: 'world.planned.created' },
      }),
    ).toBe(0);
  });

  it('(c) bootstrap (empty DB) → creates exactly one world, opened immediately', async () => {
    const now = new Date();

    const result = await worker.handleLifecycleTick(now);
    expect(result.plannedCreated).toBe(1);

    const worlds = await ctx.prisma.world.findMany();
    expect(worlds).toHaveLength(1);
    expect(worlds[0].status).toBe('OPEN');
    expect(worlds[0].startedAt).toEqual(now);
    const plannedRemaining = await ctx.prisma.world.count({
      where: { status: 'PLANNED' },
    });
    expect(plannedRemaining).toBe(0);

    const events = await ctx.prisma.eventOutbox.findMany({
      where: { kind: 'world.planned.created' },
    });
    expect(events).toHaveLength(1);
    expect(events[0].aggregateId).toBe(worlds[0].id);
  });
});
