import request from 'supertest';
import { Prisma } from '@prisma/client';
import { isSerializationFailure } from '../src/common/serializable-retry.utils';
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

  // Run 097 — the "1 noble per village" cap must cover the full conquest
  // lifecycle: a noble sent on a conquest (in flight, then occupying a target)
  // still belongs to the origin village, so it cannot recruit a 2nd one until
  // the conquest resolves.
  async function freshNobleVillage(tag: string) {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server, `${tag}-${Date.now()}`);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      `${tag}-village`,
    );
    const villageId = join.village.id;
    await prepareNobleVillage(villageId, user.userId, world.id);
    return { world, user, villageId, x: join.village.x, y: join.village.y };
  }

  function recruit(villageId: string, accessToken: string) {
    return request(ctx.server)
      .post(`/army/${villageId}/throne/recruit-noble`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});
  }

  it('blocks recruiting while a noble is EN_ROUTE (IN_FLIGHT)', async () => {
    const { world, user, villageId, x, y } =
      await freshNobleVillage('noble-flight');

    await ctx.prisma.expedition.create({
      data: {
        worldId: world.id,
        attackerVillageId: villageId,
        kind: 'ATTACK',
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: 'target-en-route',
        targetX: x + 3,
        targetY: y,
        units: { NOBLE: 1 },
        status: 'EN_ROUTE',
        departAt: new Date(),
        arrivalAt: new Date(Date.now() + 60_000),
        outboundTravelMs: 60_000,
      },
    });

    const res = await recruit(villageId, user.accessToken);
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      message: 'A noble is already on campaign',
    });

    const trainings = await ctx.prisma.unitTraining.count({
      where: { villageId, unitType: 'NOBLE' },
    });
    expect(trainings).toBe(0);
  }, 30_000);

  it('blocks recruiting while a noble occupies a target (OCCUPYING)', async () => {
    const { world, user, villageId, x, y } =
      await freshNobleVillage('noble-occupy');

    const target = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        naturalTrait: 'PLAINS',
        isBarbarian: true,
        name: 'occupied-target',
        x: x + 2,
        y,
        tier: 'T1',
        resourceStock: {
          create: { wood: 0, stone: 0, iron: 0, maxPerType: 100_000 },
        },
      },
    });

    await ctx.prisma.pendingConquest.create({
      data: {
        attackerVillageId: villageId,
        attackerUserId: user.userId,
        targetVillageId: target.id,
        worldId: world.id,
        captureUntil: new Date(Date.now() + 60_000),
        status: 'OPEN',
      },
    });

    const res = await recruit(villageId, user.accessToken);
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      message: 'A noble is already occupying a conquered village',
    });
  }, 30_000);

  it('allows recruiting once the conquest is resolved (COMPLETED)', async () => {
    const { world, user, villageId, x, y } =
      await freshNobleVillage('noble-resolved');

    const target = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        naturalTrait: 'PLAINS',
        isBarbarian: true,
        name: 'resolved-target',
        x: x + 2,
        y,
        tier: 'T1',
        resourceStock: {
          create: { wood: 0, stone: 0, iron: 0, maxPerType: 100_000 },
        },
      },
    });

    // Conquest done: the noble is installed in the conquered village, no longer
    // owned by the origin. A COMPLETED window must NOT block re-recruitment.
    await ctx.prisma.pendingConquest.create({
      data: {
        attackerVillageId: villageId,
        attackerUserId: user.userId,
        targetVillageId: target.id,
        worldId: world.id,
        captureUntil: new Date(Date.now() - 60_000),
        status: 'COMPLETED',
      },
    });

    const res = await recruit(villageId, user.accessToken);
    expect(res.status).toBeLessThan(300);

    const training = await ctx.prisma.unitTraining.findFirst({
      where: { villageId, unitType: 'NOBLE' },
    });
    expect(training?.building).toBe('THRONE_HALL');
  }, 30_000);

  it('blocks a surviving noble returning home but allows a lost one', async () => {
    const returned = await freshNobleVillage('noble-return-alive');
    await ctx.prisma.expedition.create({
      data: {
        worldId: returned.world.id,
        attackerVillageId: returned.villageId,
        kind: 'ATTACK',
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: 'target-returning',
        targetX: returned.x + 3,
        targetY: returned.y,
        units: { NOBLE: 1 },
        survivingUnits: { NOBLE: 1 },
        status: 'RETURNING',
        departAt: new Date(Date.now() - 120_000),
        arrivalAt: new Date(Date.now() - 60_000),
        outboundTravelMs: 60_000,
        returnAt: new Date(Date.now() + 60_000),
      },
    });
    const aliveRes = await recruit(
      returned.villageId,
      returned.user.accessToken,
    );
    expect(aliveRes.status).toBe(400);
    expect(aliveRes.body).toMatchObject({
      message: 'A noble is already on campaign',
    });

    // A returning expedition whose noble died carries no NOBLE in
    // survivingUnits, so the origin can recruit again immediately.
    const lost = await freshNobleVillage('noble-return-dead');
    await ctx.prisma.expedition.create({
      data: {
        worldId: lost.world.id,
        attackerVillageId: lost.villageId,
        kind: 'ATTACK',
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: 'target-dead-noble',
        targetX: lost.x + 3,
        targetY: lost.y,
        units: { NOBLE: 1 },
        survivingUnits: {},
        status: 'RETURNING',
        departAt: new Date(Date.now() - 120_000),
        arrivalAt: new Date(Date.now() - 60_000),
        outboundTravelMs: 60_000,
        returnAt: new Date(Date.now() + 60_000),
      },
    });
    const deadRes = await recruit(lost.villageId, lost.user.accessToken);
    expect(deadRes.status).toBeLessThan(300);
  }, 45_000);

  it('allows recruiting once a conquest is interrupted (INTERRUPTED)', async () => {
    const { world, user, villageId, x, y } =
      await freshNobleVillage('noble-interrupted');

    const target = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        naturalTrait: 'PLAINS',
        isBarbarian: true,
        name: 'interrupted-target',
        x: x + 2,
        y,
        tier: 'T1',
        resourceStock: {
          create: { wood: 0, stone: 0, iron: 0, maxPerType: 100_000 },
        },
      },
    });

    // Interrupted window: the occupying noble was destroyed with the garrison,
    // so the origin is free to recruit again.
    await ctx.prisma.pendingConquest.create({
      data: {
        attackerVillageId: villageId,
        attackerUserId: user.userId,
        targetVillageId: target.id,
        worldId: world.id,
        captureUntil: new Date(Date.now() - 60_000),
        status: 'INTERRUPTED',
      },
    });

    const res = await recruit(villageId, user.accessToken);
    expect(res.status).toBeLessThan(300);
  }, 30_000);

  async function noblesOwnedBy(villageId: string) {
    const [inv, training, inFlight, occupying] = await Promise.all([
      ctx.prisma.unitInventory.findUnique({
        where: { villageId_unitType: { villageId, unitType: 'NOBLE' } },
      }),
      ctx.prisma.unitTraining.count({
        where: { villageId, unitType: 'NOBLE' },
      }),
      // Every expedition created in this test carries exactly one noble.
      ctx.prisma.expedition.count({
        where: {
          attackerVillageId: villageId,
          status: { in: ['EN_ROUTE', 'RETURNING'] },
        },
      }),
      ctx.prisma.pendingConquest.count({
        where: { attackerVillageId: villageId, status: 'OPEN' },
      }),
    ]);
    return (inv?.quantity ?? 0) + training + inFlight + occupying;
  }

  // Mimics return.worker: credit the surviving noble back to the origin garrison
  // and mark the expedition RESOLVED, atomically, under Serializable (with retry
  // to survive SSI conflicts with the concurrent recruit) — exactly the rows the
  // real return worker touches.
  async function landReturningNoble(expeditionId: string, villageId: string) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        await ctx.prisma.$transaction(
          async (tx) => {
            const exp = await tx.expedition.findUnique({
              where: { id: expeditionId },
            });
            if (!exp || exp.status !== 'RETURNING') return;
            await tx.unitInventory.upsert({
              where: {
                villageId_unitType: { villageId, unitType: 'NOBLE' },
              },
              create: { villageId, unitType: 'NOBLE', quantity: 1 },
              update: { quantity: { increment: 1 } },
            });
            await tx.expedition.update({
              where: { id: expeditionId },
              data: { status: 'RESOLVED' },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        return;
      } catch (error) {
        if (isSerializationFailure(error) && attempt < 4) continue;
        throw error;
      }
    }
  }

  // Run 097 — interleaving proof (acceptance #6). This races recruit against a
  // returning noble landing home — the away→home hand-off that genuinely needs
  // snapshot isolation. Under READ COMMITTED the gate can read the origin
  // inventory BEFORE the credit and the expedition AFTER it flips to RESOLVED,
  // observing "no noble anywhere" and minting a 2nd one. The fix makes the gate
  // Serializable, so it always sees one consistent snapshot: either the
  // expedition still RETURNING (blocked IN_FLIGHT) or the noble already in
  // garrison (blocked GARRISON_FULL) — never the torn state. Each round asserts
  // the landing actually committed (non-vacuous), recruit was rejected, and the
  // village owns exactly one noble.
  it('interleaving: recruit racing a noble landing home never breaks the cap (#6)', async () => {
    const { world, user, villageId, x, y } =
      await freshNobleVillage('noble-race');

    for (let round = 0; round < 8; round += 1) {
      await ctx.prisma.expedition.deleteMany({
        where: { attackerVillageId: villageId },
      });
      await ctx.prisma.unitTraining.deleteMany({
        where: { villageId, unitType: 'NOBLE' },
      });
      // The noble is away (returning) — inventory empty, resources full so a
      // (hypothetically) mis-allowed recruit would actually mint a 2nd noble.
      await ctx.prisma.unitInventory.upsert({
        where: { villageId_unitType: { villageId, unitType: 'NOBLE' } },
        create: { villageId, unitType: 'NOBLE', quantity: 0 },
        update: { quantity: 0 },
      });
      await prepareNobleVillage(villageId, user.userId, world.id);

      const returning = await ctx.prisma.expedition.create({
        data: {
          worldId: world.id,
          attackerVillageId: villageId,
          kind: 'ATTACK',
          targetKind: 'BARBARIAN_VILLAGE',
          targetRefId: 'race-return-target',
          targetX: x + 3,
          targetY: y,
          units: { NOBLE: 1 },
          survivingUnits: { NOBLE: 1 },
          status: 'RETURNING',
          departAt: new Date(Date.now() - 120_000),
          arrivalAt: new Date(Date.now() - 60_000),
          outboundTravelMs: 60_000,
          returnAt: new Date(),
        },
      });

      const [, recruitResult] = await Promise.allSettled([
        landReturningNoble(returning.id, villageId),
        recruit(villageId, user.accessToken),
      ]);

      // Non-vacuous: the landing genuinely committed this round.
      const landed = await ctx.prisma.expedition.findUniqueOrThrow({
        where: { id: returning.id },
      });
      expect(landed.status).toBe('RESOLVED');
      const inv = await ctx.prisma.unitInventory.findUniqueOrThrow({
        where: { villageId_unitType: { villageId, unitType: 'NOBLE' } },
      });
      expect(inv.quantity).toBe(1);

      // Recruit always saw a noble (returning or landed) → rejected, no 2nd one.
      if (recruitResult.status === 'fulfilled') {
        expect(recruitResult.value.status).toBe(400);
      }
      expect(await noblesOwnedBy(villageId)).toBe(1);
    }
  }, 60_000);
});
