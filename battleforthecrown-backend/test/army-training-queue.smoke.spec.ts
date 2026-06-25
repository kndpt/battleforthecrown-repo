import request from 'supertest';
import { UNIT_TYPES } from '@battleforthecrown/shared/army';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  waitFor,
  type SmokeContext,
} from './helpers';

// Split out of army-training.smoke.spec.ts (run 083 perf): the training-queue
// mechanics (deferred scheduling, dedup, head/waiting cancellation) each wait a
// full worker chain, so they live in their own file to run on a separate Jest
// worker in parallel with the base training cases.
describe('army training queue smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
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
