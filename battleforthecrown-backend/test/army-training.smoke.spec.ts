import request from 'supertest';
import { UNIT_CATALOG, UNIT_TYPES } from '@battleforthecrown/shared/army';
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

  it('training: cancel returns refunded cost payload for remaining units', async () => {
    const world = await seedSmokeWorld(
      ctx.prisma,
      `train-cancel-${Date.now()}`,
    );
    await ctx.prisma.world.update({
      where: { id: world.id },
      data: {
        config: {
          ...SMOKE_WORLD_CONFIG,
          tempo: {
            ...SMOKE_WORLD_CONFIG.tempo,
            overrides: {
              ...SMOKE_WORLD_CONFIG.tempo.overrides,
              unitTrainingSpeed: 1,
            },
          },
        },
      },
    });
    const user = await registerUser(ctx.server, 'train-cancel');
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'train-cancel-village',
    );
    const villageId = join.village.id;
    const unitCost = UNIT_CATALOG.costs[UNIT_TYPES.MILITIA];

    await ctx.prisma.building.updateMany({
      where: { villageId, type: 'BARRACKS' },
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

    const train = await request(ctx.server)
      .post(`/army/${villageId}/train`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ unitType: UNIT_TYPES.MILITIA, quantity: 3 });
    expect(train.status).toBeLessThan(300);

    const training = await ctx.prisma.unitTraining.findFirstOrThrow({
      where: { villageId, unitType: UNIT_TYPES.MILITIA },
    });
    const cancel = await request(ctx.server)
      .delete(`/army/${villageId}/training/${training.id}/cancel`)
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(cancel.status).toBeLessThan(300);
    expect(cancel.body).toEqual({
      success: true,
      refunded: {
        wood: unitCost.wood * 3,
        stone: unitCost.stone * 3,
        iron: unitCost.iron * 3,
        population: unitCost.population * 3,
        crowns: 0,
      },
    });
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
        config: config,
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

  it('training: queues a second unit type and auto-starts it after the first completes', async () => {
    const world = await seedSmokeWorld(ctx.prisma, `train-multi-${Date.now()}`);
    const user = await registerUser(ctx.server, 'train-multi');
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'train-multi-village',
    );
    const villageId = join.village.id;

    // WARRIOR requires Barracks level 3; MILITIA only level 1.
    await ctx.prisma.building.updateMany({
      where: { villageId, type: 'BARRACKS' },
      data: { level: 3 },
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

    const trainA = await request(ctx.server)
      .post(`/army/${villageId}/train`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ unitType: UNIT_TYPES.MILITIA, quantity: 1 });
    expect(trainA.status).toBeLessThan(300);

    // Previously returned 400 'Training already in progress'; now queues.
    const trainB = await request(ctx.server)
      .post(`/army/${villageId}/train`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ unitType: UNIT_TYPES.WARRIOR, quantity: 1 });
    expect(trainB.status).toBeLessThan(300);

    // Both rows coexist (the @@unique([villageId, building]) was dropped; one
    // row per unit type is still enforced by @@unique([..., unitType])).
    const rows = await ctx.prisma.unitTraining.findMany({
      where: { villageId, building: 'BARRACKS' },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    expect(rows.map((row) => row.unitType)).toEqual([
      UNIT_TYPES.MILITIA,
      UNIT_TYPES.WARRIOR,
    ]);

    // getInventory surfaces the oldest row (MILITIA) as the active training.
    const inventory = await request(ctx.server)
      .get(`/army/${villageId}/inventory`)
      .set('Authorization', `Bearer ${user.accessToken}`);
    const slots = inventory.body as Array<{
      type: string;
      trainingStartTime?: string;
    }>;
    const militiaSlot = slots.find((slot) => slot.type === UNIT_TYPES.MILITIA);
    const warriorSlot = slots.find((slot) => slot.type === UNIT_TYPES.WARRIOR);
    expect(militiaSlot?.trainingStartTime).toBeTruthy();
    expect(warriorSlot?.trainingStartTime).toBeFalsy();

    // The worker completes MILITIA then auto-promotes WARRIOR — WARRIOR ends up
    // trained even though it was never re-posted (deferred scheduling).
    await waitFor(
      () =>
        ctx.prisma.unitInventory.findFirst({
          where: {
            villageId,
            unitType: UNIT_TYPES.WARRIOR,
            quantity: { gte: 1 },
          },
        }),
      { timeoutMs: 15_000 },
    );
    const militiaInventory = await ctx.prisma.unitInventory.findFirst({
      where: { villageId, unitType: UNIT_TYPES.MILITIA },
    });
    expect(militiaInventory?.quantity ?? 0).toBeGreaterThanOrEqual(1);

    // Queue fully drained once both completed.
    const remaining = await ctx.prisma.unitTraining.count({
      where: { villageId, building: 'BARRACKS' },
    });
    expect(remaining).toBe(0);
  });

  it('training: rejects a second training of the same unit type (one row per type)', async () => {
    const world = await seedSmokeWorld(ctx.prisma, `train-dup-${Date.now()}`);
    const user = await registerUser(ctx.server, 'train-dup');
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'train-dup-village',
    );
    const villageId = join.village.id;

    await ctx.prisma.building.updateMany({
      where: { villageId, type: 'BARRACKS' },
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

    const first = await request(ctx.server)
      .post(`/army/${villageId}/train`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ unitType: UNIT_TYPES.MILITIA, quantity: 1 });
    expect(first.status).toBeLessThan(300);

    const second = await request(ctx.server)
      .post(`/army/${villageId}/train`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ unitType: UNIT_TYPES.MILITIA, quantity: 1 });
    expect(second.status).toBe(400);

    // Only the first MILITIA row exists; no duplicate persisted.
    const militiaRows = await ctx.prisma.unitTraining.count({
      where: { villageId, building: 'BARRACKS', unitType: UNIT_TYPES.MILITIA },
    });
    expect(militiaRows).toBe(1);
  });

  it('training: cancelling the active head promotes the next queued unit type', async () => {
    const world = await seedSmokeWorld(
      ctx.prisma,
      `train-cancel-head-${Date.now()}`,
    );
    const user = await registerUser(ctx.server, 'train-cancel-head');
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'train-cancel-head-village',
    );
    const villageId = join.village.id;

    await ctx.prisma.building.updateMany({
      where: { villageId, type: 'BARRACKS' },
      data: { level: 3 },
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

    // Head = MILITIA x3 (still training); WARRIOR x1 waits behind it.
    const trainHead = await request(ctx.server)
      .post(`/army/${villageId}/train`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ unitType: UNIT_TYPES.MILITIA, quantity: 3 });
    expect(trainHead.status).toBeLessThan(300);
    const trainNext = await request(ctx.server)
      .post(`/army/${villageId}/train`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ unitType: UNIT_TYPES.WARRIOR, quantity: 1 });
    expect(trainNext.status).toBeLessThan(300);

    const head = await ctx.prisma.unitTraining.findFirstOrThrow({
      where: { villageId, unitType: UNIT_TYPES.MILITIA },
    });
    const cancel = await request(ctx.server)
      .delete(`/army/${villageId}/training/${head.id}/cancel`)
      .set('Authorization', `Bearer ${user.accessToken}`);
    expect(cancel.status).toBeLessThan(300);

    // Cancelling the head promotes WARRIOR, which trains without re-posting.
    await waitFor(
      () =>
        ctx.prisma.unitInventory.findFirst({
          where: {
            villageId,
            unitType: UNIT_TYPES.WARRIOR,
            quantity: { gte: 1 },
          },
        }),
      { timeoutMs: 15_000 },
    );
    const remaining = await ctx.prisma.unitTraining.count({
      where: { villageId, building: 'BARRACKS' },
    });
    expect(remaining).toBe(0);
  });

  it('training: cancelling a waiting unit leaves the active head untouched', async () => {
    const world = await seedSmokeWorld(
      ctx.prisma,
      `train-cancel-wait-${Date.now()}`,
    );
    const user = await registerUser(ctx.server, 'train-cancel-wait');
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'train-cancel-wait-village',
    );
    const villageId = join.village.id;

    await ctx.prisma.building.updateMany({
      where: { villageId, type: 'BARRACKS' },
      data: { level: 3 },
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

    // Head = MILITIA x3 (training); WARRIOR x1 waits behind it.
    const trainHead = await request(ctx.server)
      .post(`/army/${villageId}/train`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ unitType: UNIT_TYPES.MILITIA, quantity: 3 });
    expect(trainHead.status).toBeLessThan(300);
    const trainWaiting = await request(ctx.server)
      .post(`/army/${villageId}/train`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ unitType: UNIT_TYPES.WARRIOR, quantity: 1 });
    expect(trainWaiting.status).toBeLessThan(300);

    // Cancel the WAITING row (WARRIOR), not the head.
    const waiting = await ctx.prisma.unitTraining.findFirstOrThrow({
      where: { villageId, unitType: UNIT_TYPES.WARRIOR },
    });
    const cancel = await request(ctx.server)
      .delete(`/army/${villageId}/training/${waiting.id}/cancel`)
      .set('Authorization', `Bearer ${user.accessToken}`);
    expect(cancel.status).toBeLessThan(300);

    // The head (MILITIA) keeps training and completes on its own.
    await waitFor(
      () =>
        ctx.prisma.unitInventory.findFirst({
          where: {
            villageId,
            unitType: UNIT_TYPES.MILITIA,
            quantity: { gte: 3 },
          },
        }),
      { timeoutMs: 15_000 },
    );
    // WARRIOR was cancelled before promotion ⇒ never trained.
    const warriorInventory = await ctx.prisma.unitInventory.findFirst({
      where: { villageId, unitType: UNIT_TYPES.WARRIOR },
    });
    expect(warriorInventory?.quantity ?? 0).toBe(0);
  });
});
