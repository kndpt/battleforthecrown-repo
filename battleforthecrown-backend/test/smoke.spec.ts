import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  outboxDispatched,
  registerUser,
  seedSmokeWorld,
  truncateAll,
  waitFor,
  type SmokeContext,
} from './helpers';

describe('smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await truncateAll(ctx.prisma);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('production tick: ResourceStock.lastUpdateTs is bumped for active villages', async () => {
    // ProductionWorker does NOT emit resources.changed by design — frontend
    // interpolates between mutation-driven events (cf. production.worker.ts).
    // We assert on the DB side-effect (lastUpdateTs progression) instead.
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(ctx.server, user.accessToken, world.id, 'tick-village');
    const villageId = join.village.id;

    const before = await ctx.prisma.resourceStock.findUniqueOrThrow({ where: { villageId } });
    await new Promise((r) => setTimeout(r, 1100));
    await ctx.boss.send('production:tick', {});

    await waitFor(
      async () => {
        const after = await ctx.prisma.resourceStock.findUniqueOrThrow({ where: { villageId } });
        return after.lastUpdateTs > before.lastUpdateTs ? after : null;
      },
      { timeoutMs: 10_000 },
    );
  });

  it('construction: upgrade WOOD → Building.level=2 + building.completed dispatched', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(ctx.server, user.accessToken, world.id, 'build-village');
    const villageId = join.village.id;

    await ctx.prisma.resourceStock.update({
      where: { villageId },
      data: { wood: 1_000_000, stone: 1_000_000, iron: 1_000_000, maxPerType: 10_000_000 },
    });

    const res = await request(ctx.server)
      .post(`/village/${villageId}/upgrade`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ buildingType: 'WOOD' });
    expect(res.status).toBeLessThan(300);

    const upgradedBuilding = await waitFor(
      () => ctx.prisma.building.findFirst({ where: { villageId, type: 'WOOD', level: 2 } }),
      { timeoutMs: 10_000 },
    );

    const event = await outboxDispatched(
      ctx.prisma,
      { kind: 'building.completed', aggregateId: upgradedBuilding.id },
      { timeoutMs: 10_000 },
    );
    expect(event?.dispatchedAt).toBeTruthy();
  });
});
