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

  it('training: train 1 MILITIA → UnitInventory + unit.training.completed dispatched', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(ctx.server, user.accessToken, world.id, 'train-village');
    const villageId = join.village.id;

    const barracks = await ctx.prisma.building.findFirstOrThrow({ where: { villageId, type: 'BARRACKS' } });
    await ctx.prisma.building.update({ where: { id: barracks.id }, data: { level: 1 } });
    await ctx.prisma.resourceStock.update({
      where: { villageId },
      data: { wood: 100_000, stone: 100_000, iron: 100_000, maxPerType: 1_000_000 },
    });
    await ctx.prisma.population.update({ where: { villageId }, data: { used: 0, max: 1000 } });

    const res = await request(ctx.server)
      .post(`/army/${villageId}/train`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ unitType: 'MILITIA', quantity: 1 });
    expect(res.status).toBeLessThan(300);

    await waitFor(
      () =>
        ctx.prisma.unitInventory.findFirst({
          where: { villageId, unitType: 'MILITIA', quantity: { gte: 1 } },
        }),
      { timeoutMs: 10_000 },
    );

    const event = await outboxDispatched(
      ctx.prisma,
      { kind: 'unit.training.completed', aggregateId: villageId },
      { timeoutMs: 10_000 },
    );
    expect(event?.dispatchedAt).toBeTruthy();
  });

  it('combat: attack a barbarian → battle.resolved + battle.returned dispatched', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(ctx.server, user.accessToken, world.id, 'attacker');
    const attackerId = join.village.id;

    const barbarian = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        isBarbarian: true,
        name: 'barb-target',
        x: join.village.x + 1,
        y: join.village.y,
        tier: 'T1',
        resourceStock: {
          create: { wood: 500, stone: 500, iron: 500, maxPerType: 100_000 },
        },
      },
    });

    await ctx.prisma.unitInventory.create({
      data: { villageId: attackerId, unitType: 'MILITIA', quantity: 100 },
    });

    const res = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        villageId: attackerId,
        targetX: barbarian.x,
        targetY: barbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: barbarian.id,
        units: { MILITIA: 100 },
      });
    expect(res.status).toBeLessThan(300);

    const resolved = await outboxDispatched(
      ctx.prisma,
      { kind: 'battle.resolved', aggregateId: attackerId },
      { timeoutMs: 15_000 },
    );
    expect(resolved?.dispatchedAt).toBeTruthy();

    const returned = await outboxDispatched(
      ctx.prisma,
      { kind: 'battle.returned', aggregateId: attackerId },
      { timeoutMs: 15_000 },
    );
    expect(returned?.dispatchedAt).toBeTruthy();
  });
});
