import request from 'supertest';
import { UNIT_TYPES } from '@battleforthecrown/shared/army';
import type { WorldConfig } from '@battleforthecrown/shared/world';
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

describe('army training smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('training: train 3 MILITIA → UnitInventory + unit.trained per unit + completion', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'train-village',
    );
    const villageId = join.village.id;

    const barracks = await ctx.prisma.building.findFirstOrThrow({
      where: { villageId, type: 'BARRACKS' },
    });
    await ctx.prisma.building.update({
      where: { id: barracks.id },
      data: { level: 1 },
    });
    await ctx.prisma.resourceStock.update({
      where: { villageId },
      data: {
        wood: 100_000,
        stone: 100_000,
        iron: 100_000,
        maxPerType: 1_000_000,
      },
    });
    await ctx.prisma.population.update({
      where: { villageId },
      data: { used: 0, max: 1000 },
    });

    const res = await request(ctx.server)
      .post(`/army/${villageId}/train`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ unitType: 'MILITIA', quantity: 3 });
    expect(res.status).toBeLessThan(300);

    await waitFor(
      () =>
        ctx.prisma.unitInventory.findFirst({
          where: { villageId, unitType: 'MILITIA', quantity: { gte: 3 } },
        }),
      { timeoutMs: 15_000 },
    );

    const event = await outboxDispatched(
      ctx.prisma,
      { kind: 'unit.training.completed', aggregateId: villageId },
      { timeoutMs: 15_000 },
    );
    expect(event?.dispatchedAt).toBeTruthy();

    const events = await ctx.prisma.eventOutbox.findMany({
      where: {
        aggregateId: villageId,
        kind: { in: ['unit.trained', 'unit.training.completed'] },
      },
      orderBy: { createdAt: 'asc' },
    });
    expect(events.filter((item) => item.kind === 'unit.trained')).toHaveLength(
      3,
    );
    expect(
      events.filter((item) => item.kind === 'unit.training.completed'),
    ).toHaveLength(1);
    expect(events).toHaveLength(4);
  });

  it('training: accepts WARRIOR when an ECONOMIC population bonus covers the quantity', async () => {
    const world = await seedSmokeWorld(
      ctx.prisma,
      `train-warrior-${Date.now()}`,
    );
    const user = await registerUser(ctx.server, 'train-warrior');
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'train-warrior-village',
    );
    const villageId = join.village.id;

    await ctx.prisma.building.updateMany({
      where: { villageId, type: 'BARRACKS' },
      data: { level: 3 },
    });
    await ctx.prisma.villageStrategyConfig.upsert({
      where: { villageId },
      create: { villageId, strategy: 'ECONOMIC' },
      update: { strategy: 'ECONOMIC' },
    });
    await ctx.prisma.resourceStock.update({
      where: { villageId },
      data: {
        wood: 100_000,
        stone: 100_000,
        iron: 100_000,
        maxPerType: 1_000_000,
      },
    });
    await ctx.prisma.population.update({
      where: { villageId },
      data: { used: 166, max: 250 },
    });

    const res = await request(ctx.server)
      .post(`/army/${villageId}/train`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ unitType: UNIT_TYPES.WARRIOR, quantity: 43 });

    expect(res.status).toBeLessThan(300);
    await expect(
      ctx.prisma.unitTraining.findFirstOrThrow({
        where: { villageId, unitType: UNIT_TYPES.WARRIOR },
      }),
    ).resolves.toMatchObject({ totalQty: 43, completedQty: 0 });
    await expect(
      ctx.prisma.population.findUniqueOrThrow({ where: { villageId } }),
    ).resolves.toMatchObject({ used: 252, max: 250 });
  });

  it('training: applies barracks level speed bonus to UnitTraining.timePerUnitMs', async () => {
    const config: WorldConfig = {
      ...SMOKE_WORLD_CONFIG,
      tempo: {
        ...SMOKE_WORLD_CONFIG.tempo,
        overrides: {
          ...SMOKE_WORLD_CONFIG.tempo.overrides,
          unitTrainingSpeed: 1,
        },
      },
    };
    const world = await ctx.prisma.world.create({
      data: {
        id: `train-barracks-speed-${Date.now()}`,
        name: 'train-barracks-speed',
        status: 'OPEN',
        config: config as object,
      },
    });
    const levelOneUser = await registerUser(ctx.server, 'train-barracks-l1');
    const levelFiveUser = await registerUser(ctx.server, 'train-barracks-l5');
    const levelOneJoin = await joinWorld(
      ctx.server,
      levelOneUser.accessToken,
      world.id,
      'train-barracks-l1-village',
    );
    const levelFiveJoin = await joinWorld(
      ctx.server,
      levelFiveUser.accessToken,
      world.id,
      'train-barracks-l5-village',
    );
    const levelOneVillageId = levelOneJoin.village.id;
    const levelFiveVillageId = levelFiveJoin.village.id;

    await ctx.prisma.building.updateMany({
      where: { villageId: levelOneVillageId, type: 'BARRACKS' },
      data: { level: 1 },
    });
    await ctx.prisma.building.updateMany({
      where: { villageId: levelFiveVillageId, type: 'BARRACKS' },
      data: { level: 5 },
    });
    await ctx.prisma.resourceStock.updateMany({
      where: { villageId: { in: [levelOneVillageId, levelFiveVillageId] } },
      data: {
        wood: 100_000,
        stone: 100_000,
        iron: 100_000,
        maxPerType: 1_000_000,
      },
    });
    await ctx.prisma.population.updateMany({
      where: { villageId: { in: [levelOneVillageId, levelFiveVillageId] } },
      data: { used: 0, max: 1000 },
    });

    const levelOneRes = await request(ctx.server)
      .post(`/army/${levelOneVillageId}/train`)
      .set('Authorization', `Bearer ${levelOneUser.accessToken}`)
      .send({ unitType: UNIT_TYPES.MILITIA, quantity: 1 });
    const levelFiveRes = await request(ctx.server)
      .post(`/army/${levelFiveVillageId}/train`)
      .set('Authorization', `Bearer ${levelFiveUser.accessToken}`)
      .send({ unitType: UNIT_TYPES.MILITIA, quantity: 1 });

    expect(levelOneRes.status).toBeLessThan(300);
    expect(levelFiveRes.status).toBeLessThan(300);

    const [levelOneTraining, levelFiveTraining] = await Promise.all([
      ctx.prisma.unitTraining.findFirstOrThrow({
        where: { villageId: levelOneVillageId, unitType: UNIT_TYPES.MILITIA },
      }),
      ctx.prisma.unitTraining.findFirstOrThrow({
        where: { villageId: levelFiveVillageId, unitType: UNIT_TYPES.MILITIA },
      }),
    ]);

    expect(levelFiveTraining.timePerUnitMs).toBeLessThan(
      levelOneTraining.timePerUnitMs,
    );
    expect(levelFiveTraining.timePerUnitMs).not.toBe(
      levelOneTraining.timePerUnitMs,
    );
  });
});
