import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  outboxDispatched,
  registerUser,
  seedSmokeWorld,
  waitFor,
  type SmokeContext,
} from './helpers';
import { SMOKE_WORLD_CONFIG } from './fixtures/smoke-world-config';

describe('recruit noble smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  async function prepareNobleVillage(
    villageId: string,
    userId: string,
    worldId: string,
  ) {
    const throneHall = await ctx.prisma.building.findFirst({
      where: { villageId, type: 'THRONE_HALL' },
    });

    if (throneHall) {
      await ctx.prisma.building.update({
        where: { id: throneHall.id },
        data: { level: 1 },
      });
    } else {
      await ctx.prisma.building.create({
        data: { villageId, type: 'THRONE_HALL', level: 1 },
      });
    }

    await ctx.prisma.resourceStock.update({
      where: { villageId },
      data: {
        wood: 6_000,
        stone: 6_000,
        iron: 6_000,
        maxPerType: 20_000,
      },
    });

    await ctx.prisma.population.update({
      where: { villageId },
      data: { used: 0, max: 100 },
    });

    await ctx.prisma.crownBalance.update({
      where: { userId_worldId: { userId, worldId } },
      data: { balance: 6_000 },
    });
  }

  it('POST /army/:villageId/throne/recruit-noble debits costs, emits outbox, then cancel refunds', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    await ctx.prisma.world.update({
      where: { id: world.id },
      data: {
        config: {
          ...SMOKE_WORLD_CONFIG,
          tempo: {
            ...SMOKE_WORLD_CONFIG.tempo,
            overrides: {
              ...SMOKE_WORLD_CONFIG.tempo.overrides,
              lordTrainingSpeed: 1,
            },
          },
        },
      },
    });

    const user = await registerUser(ctx.server, 'noble-cancel' + Date.now());
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'noble-cancel-village',
    );
    const villageId = join.village.id;
    await prepareNobleVillage(villageId, user.userId, world.id);

    const recruit = await request(ctx.server)
      .post(`/army/${villageId}/throne/recruit-noble`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({});

    expect(recruit.status).toBeLessThan(300);

    const training = await ctx.prisma.unitTraining.findFirstOrThrow({
      where: { villageId, unitType: 'NOBLE' },
    });
    expect(training.building).toBe('THRONE_HALL');
    expect(training.totalQty).toBe(1);

    const stockAfterRecruit = await ctx.prisma.resourceStock.findUniqueOrThrow({
      where: { villageId },
    });
    expect(stockAfterRecruit.wood).toBe(1_000);
    expect(stockAfterRecruit.stone).toBe(1_000);
    expect(stockAfterRecruit.iron).toBe(1_000);

    const popAfterRecruit = await ctx.prisma.population.findUniqueOrThrow({
      where: { villageId },
    });
    expect(popAfterRecruit.used).toBe(15);

    const crownsAfterRecruit = await ctx.prisma.crownBalance.findUniqueOrThrow({
      where: { userId_worldId: { userId: user.userId, worldId: world.id } },
    });
    expect(crownsAfterRecruit.balance).toBe(1_000);

    await outboxDispatched(
      ctx.prisma,
      { kind: 'resources.changed', aggregateId: villageId },
      { timeoutMs: 10_000 },
    );
    await outboxDispatched(
      ctx.prisma,
      { kind: 'crowns.changed', aggregateId: user.userId },
      { timeoutMs: 10_000 },
    );

    const dispatchedCrownsBeforeCancel = await ctx.prisma.eventOutbox.count({
      where: {
        kind: 'crowns.changed',
        aggregateId: user.userId,
        dispatchedAt: { not: null },
      },
    });

    const cancel = await request(ctx.server)
      .delete(`/army/${villageId}/training/${training.id}/cancel`)
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(cancel.status).toBeLessThan(300);
    expect(cancel.body).toEqual({
      success: true,
      refunded: {
        wood: 5_000,
        stone: 5_000,
        iron: 5_000,
        population: 15,
        crowns: 5_000,
      },
    });

    await waitFor(
      async () => {
        const count = await ctx.prisma.eventOutbox.count({
          where: {
            kind: 'crowns.changed',
            aggregateId: user.userId,
            dispatchedAt: { not: null },
          },
        });
        return count > dispatchedCrownsBeforeCancel ? count : null;
      },
      { timeoutMs: 10_000 },
    );

    await expect(
      ctx.prisma.unitTraining.findUnique({ where: { id: training.id } }),
    ).resolves.toBeNull();

    const stockAfterCancel = await ctx.prisma.resourceStock.findUniqueOrThrow({
      where: { villageId },
    });
    expect(stockAfterCancel.wood).toBe(6_000);
    expect(stockAfterCancel.stone).toBe(6_000);
    expect(stockAfterCancel.iron).toBe(6_000);

    const popAfterCancel = await ctx.prisma.population.findUniqueOrThrow({
      where: { villageId },
    });
    expect(popAfterCancel.used).toBe(0);

    const crownsAfterCancel = await ctx.prisma.crownBalance.findUniqueOrThrow({
      where: { userId_worldId: { userId: user.userId, worldId: world.id } },
    });
    expect(crownsAfterCancel.balance).toBe(6_000);
  }, 30_000);

  it('POST /army/:villageId/throne/recruit-noble completes through the training worker', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    await ctx.prisma.world.update({
      where: { id: world.id },
      data: {
        config: {
          ...SMOKE_WORLD_CONFIG,
          tempo: {
            ...SMOKE_WORLD_CONFIG.tempo,
            overrides: {
              ...SMOKE_WORLD_CONFIG.tempo.overrides,
              lordTrainingSpeed: 0.000001,
            },
          },
        },
      },
    });

    const user = await registerUser(ctx.server, 'noble-complete' + Date.now());
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'noble-complete-village',
    );
    const villageId = join.village.id;
    await prepareNobleVillage(villageId, user.userId, world.id);

    const recruit = await request(ctx.server)
      .post(`/army/${villageId}/throne/recruit-noble`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({});

    expect(recruit.status).toBeLessThan(300);

    await waitFor(
      () =>
        ctx.prisma.unitInventory.findFirst({
          where: { villageId, unitType: 'NOBLE', quantity: 1 },
        }),
      { timeoutMs: 15_000 },
    );

    const completed = await outboxDispatched(
      ctx.prisma,
      { kind: 'unit.training.completed', aggregateId: villageId },
      { timeoutMs: 15_000 },
    );
    expect(completed?.dispatchedAt).toBeTruthy();
  }, 30_000);
});
