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

describe('resource caravan smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('sends resources, clamps target warehouse overflow, then releases porters without units', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const userA = await registerUser(ctx.server, 'caravan-a' + Date.now());
    const joinA = await joinWorld(
      ctx.server,
      userA.accessToken,
      world.id,
      'caravan-a',
    );
    const villageAId = joinA.village.id;

    const userB = await registerUser(ctx.server, 'caravan-b' + Date.now());
    const joinB = await joinWorld(
      ctx.server,
      userB.accessToken,
      world.id,
      'caravan-b',
    );
    const villageBId = joinB.village.id;
    await ctx.prisma.village.update({
      where: { id: villageBId },
      data: {
        userId: userA.userId,
        x: joinA.village.x + 1,
        y: joinA.village.y,
      },
    });
    await ctx.prisma.resourceStock.update({
      where: { villageId: villageAId },
      data: { wood: 1000, stone: 600, iron: 0 },
    });
    await ctx.prisma.resourceStock.update({
      where: { villageId: villageBId },
      data: { wood: 2900, stone: 2990, iron: 0, maxPerType: 3000 },
    });
    await ctx.prisma.population.update({
      where: { villageId: villageAId },
      data: { used: 10, max: 20 },
    });

    const crownsBefore = await ctx.prisma.crownBalance.findUniqueOrThrow({
      where: { userId_worldId: { userId: userA.userId, worldId: world.id } },
    });

    const sendRes = await request(ctx.server)
      .post('/combat/caravan')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({
        villageId: villageAId,
        targetVillageId: villageBId,
        resources: { wood: 200, stone: 50, iron: 0 },
      });

    expect(sendRes.status).toBeLessThan(300);
    expect(sendRes.body).toMatchObject({ kind: 'CARAVAN', status: 'EN_ROUTE' });
    const expeditionId = (sendRes.body as { id: string }).id;

    const originAfterSend = await ctx.prisma.resourceStock.findUniqueOrThrow({
      where: { villageId: villageAId },
    });
    expect(originAfterSend).toMatchObject({ wood: 800, stone: 550, iron: 0 });
    const popAfterSend = await ctx.prisma.population.findUniqueOrThrow({
      where: { villageId: villageAId },
    });
    expect(popAfterSend.used).toBe(11);

    await outboxDispatched(
      ctx.prisma,
      { kind: 'caravan.arrived', aggregateId: villageBId },
      { timeoutMs: 30_000 },
    );
    const targetAfterArrival = await ctx.prisma.resourceStock.findUniqueOrThrow(
      {
        where: { villageId: villageBId },
      },
    );
    expect(targetAfterArrival).toMatchObject({
      wood: 3000,
      stone: 3000,
      iron: 0,
    });

    const arrivedEvent = await ctx.prisma.eventOutbox.findFirstOrThrow({
      where: { kind: 'caravan.arrived', aggregateId: villageBId },
      orderBy: { createdAt: 'desc' },
    });
    expect(arrivedEvent.payload).toMatchObject({
      credited: { wood: 100, stone: 10, iron: 0 },
      lost: { wood: 100, stone: 40, iron: 0 },
    });

    await waitFor(
      () =>
        ctx.prisma.expedition
          .findUnique({ where: { id: expeditionId } })
          .then((expedition) => expedition === null),
      { timeoutMs: 30_000 },
    );
    const popAfterReturn = await ctx.prisma.population.findUniqueOrThrow({
      where: { villageId: villageAId },
    });
    expect(popAfterReturn.used).toBe(10);
    const unitsAfterReturn = await ctx.prisma.unitInventory.findMany({
      where: { villageId: villageAId },
    });
    expect(unitsAfterReturn).toHaveLength(0);

    const crownsAfter = await ctx.prisma.crownBalance.findUniqueOrThrow({
      where: { userId_worldId: { userId: userA.userId, worldId: world.id } },
    });
    expect(crownsAfter.balance).toBe(crownsBefore.balance);
  }, 60_000);

  it('rejects insufficient free population without debiting resources or population', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const userA = await registerUser(ctx.server, 'caravan-pop-a' + Date.now());
    const joinA = await joinWorld(
      ctx.server,
      userA.accessToken,
      world.id,
      'caravan-pop-a',
    );
    const villageAId = joinA.village.id;
    const userB = await registerUser(ctx.server, 'caravan-pop-b' + Date.now());
    const joinB = await joinWorld(
      ctx.server,
      userB.accessToken,
      world.id,
      'caravan-pop-b',
    );
    const villageBId = joinB.village.id;
    await ctx.prisma.village.update({
      where: { id: villageBId },
      data: { userId: userA.userId },
    });
    await ctx.prisma.resourceStock.update({
      where: { villageId: villageAId },
      data: { wood: 1000, stone: 0, iron: 0 },
    });
    await ctx.prisma.population.update({
      where: { villageId: villageAId },
      data: { used: 19, max: 20 },
    });

    const res = await request(ctx.server)
      .post('/combat/caravan')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({
        villageId: villageAId,
        targetVillageId: villageBId,
        resources: { wood: 600, stone: 0, iron: 0 },
      });

    expect(res.status).toBe(400);
    await expect(
      ctx.prisma.expedition.findFirst({
        where: { attackerVillageId: villageAId },
      }),
    ).resolves.toBeNull();
    await expect(
      ctx.prisma.resourceStock.findUniqueOrThrow({
        where: { villageId: villageAId },
      }),
    ).resolves.toMatchObject({ wood: 1000, stone: 0, iron: 0 });
    await expect(
      ctx.prisma.population.findUniqueOrThrow({
        where: { villageId: villageAId },
      }),
    ).resolves.toMatchObject({ used: 19, max: 20 });
  }, 60_000);

  it('enforces the per-resource caravan capacity including active outbound caravans', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const userA = await registerUser(ctx.server, 'caravan-cap-a' + Date.now());
    const joinA = await joinWorld(
      ctx.server,
      userA.accessToken,
      world.id,
      'caravan-cap-a',
    );
    const villageAId = joinA.village.id;
    const userB = await registerUser(ctx.server, 'caravan-cap-b' + Date.now());
    const joinB = await joinWorld(
      ctx.server,
      userB.accessToken,
      world.id,
      'caravan-cap-b',
    );
    const villageBId = joinB.village.id;
    await ctx.prisma.village.update({
      where: { id: villageBId },
      data: {
        userId: userA.userId,
        x: joinA.village.x + 50,
        y: joinA.village.y,
      },
    });
    await ctx.prisma.resourceStock.update({
      where: { villageId: villageAId },
      data: { wood: 2000, stone: 2000, iron: 2000 },
    });
    await ctx.prisma.population.update({
      where: { villageId: villageAId },
      data: { used: 0, max: 20 },
    });

    const overSingleCap = await request(ctx.server)
      .post('/combat/caravan')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({
        villageId: villageAId,
        targetVillageId: villageBId,
        resources: { wood: 601, stone: 0, iron: 0 },
      });
    expect(overSingleCap.status).toBe(400);

    const first = await request(ctx.server)
      .post('/combat/caravan')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({
        villageId: villageAId,
        targetVillageId: villageBId,
        resources: { wood: 400, stone: 0, iron: 0 },
      });
    expect(first.status).toBeLessThan(300);

    const overActiveCap = await request(ctx.server)
      .post('/combat/caravan')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({
        villageId: villageAId,
        targetVillageId: villageBId,
        resources: { wood: 300, stone: 0, iron: 0 },
      });
    expect(overActiveCap.status).toBe(400);

    await expect(
      ctx.prisma.resourceStock.findUniqueOrThrow({
        where: { villageId: villageAId },
      }),
    ).resolves.toMatchObject({ wood: 1600, stone: 2000, iron: 2000 });
    await expect(
      ctx.prisma.expedition.count({
        where: {
          attackerVillageId: villageAId,
          kind: 'CARAVAN',
          status: 'EN_ROUTE',
        },
      }),
    ).resolves.toBe(1);
  }, 60_000);

  it('serializes concurrent caravan sends against the same origin capacity', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const userA = await registerUser(
      ctx.server,
      'caravan-concurrent-a' + Date.now(),
    );
    const joinA = await joinWorld(
      ctx.server,
      userA.accessToken,
      world.id,
      'caravan-concurrent-a',
    );
    const villageAId = joinA.village.id;
    const userB = await registerUser(
      ctx.server,
      'caravan-concurrent-b' + Date.now(),
    );
    const joinB = await joinWorld(
      ctx.server,
      userB.accessToken,
      world.id,
      'caravan-concurrent-b',
    );
    const villageBId = joinB.village.id;
    await ctx.prisma.village.update({
      where: { id: villageBId },
      data: {
        userId: userA.userId,
        x: joinA.village.x + 50,
        y: joinA.village.y,
      },
    });
    await ctx.prisma.resourceStock.update({
      where: { villageId: villageAId },
      data: { wood: 2000, stone: 2000, iron: 2000 },
    });
    await ctx.prisma.population.update({
      where: { villageId: villageAId },
      data: { used: 0, max: 20 },
    });

    const send = () =>
      request(ctx.server)
        .post('/combat/caravan')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({
          villageId: villageAId,
          targetVillageId: villageBId,
          resources: { wood: 400, stone: 0, iron: 0 },
        });

    const statuses = (await Promise.all([send(), send()]))
      .map((res) => res.status)
      .sort();
    expect(statuses).toEqual([201, 400]);
    await expect(
      ctx.prisma.resourceStock.findUniqueOrThrow({
        where: { villageId: villageAId },
      }),
    ).resolves.toMatchObject({ wood: 1600, stone: 2000, iron: 2000 });
    await expect(
      ctx.prisma.expedition.count({
        where: {
          attackerVillageId: villageAId,
          kind: 'CARAVAN',
          status: 'EN_ROUTE',
        },
      }),
    ).resolves.toBe(1);
  }, 60_000);

  it('recalls a caravan en route, restores resources to origin, and does not credit target', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const userA = await registerUser(
      ctx.server,
      'caravan-recall-a' + Date.now(),
    );
    const joinA = await joinWorld(
      ctx.server,
      userA.accessToken,
      world.id,
      'caravan-recall-a',
    );
    const villageAId = joinA.village.id;
    const userB = await registerUser(
      ctx.server,
      'caravan-recall-b' + Date.now(),
    );
    const joinB = await joinWorld(
      ctx.server,
      userB.accessToken,
      world.id,
      'caravan-recall-b',
    );
    const villageBId = joinB.village.id;
    await ctx.prisma.village.update({
      where: { id: villageBId },
      data: {
        userId: userA.userId,
        x: joinA.village.x + 50,
        y: joinA.village.y,
      },
    });
    await ctx.prisma.resourceStock.update({
      where: { villageId: villageAId },
      data: { wood: 1000, stone: 0, iron: 0 },
    });
    await ctx.prisma.population.update({
      where: { villageId: villageAId },
      data: { used: 10, max: 20 },
    });
    const targetBefore = await ctx.prisma.resourceStock.findUniqueOrThrow({
      where: { villageId: villageBId },
    });

    const sendRes = await request(ctx.server)
      .post('/combat/caravan')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({
        villageId: villageAId,
        targetVillageId: villageBId,
        resources: { wood: 500, stone: 0, iron: 0 },
      });
    expect(sendRes.status).toBeLessThan(300);
    const expeditionId = (sendRes.body as { id: string }).id;

    const recallRes = await request(ctx.server)
      .post(`/combat/recall/${expeditionId}`)
      .set('Authorization', `Bearer ${userA.accessToken}`);
    expect(recallRes.status).toBeLessThan(300);
    expect(recallRes.body).toMatchObject({
      recalled: true,
      status: 'RETURNING',
    });
    await expect(
      ctx.prisma.resourceStock.findUniqueOrThrow({
        where: { villageId: villageAId },
      }),
    ).resolves.toMatchObject({ wood: 1000, stone: 0, iron: 0 });
    await expect(
      ctx.prisma.population.findUniqueOrThrow({
        where: { villageId: villageAId },
      }),
    ).resolves.toMatchObject({ used: 11 });

    await waitFor(
      () =>
        ctx.prisma.expedition
          .findUnique({ where: { id: expeditionId } })
          .then((expedition) => expedition === null),
      { timeoutMs: 30_000 },
    );

    await expect(
      ctx.prisma.resourceStock.findUniqueOrThrow({
        where: { villageId: villageAId },
      }),
    ).resolves.toMatchObject({ wood: 1000, stone: 0, iron: 0 });
    await expect(
      ctx.prisma.population.findUniqueOrThrow({
        where: { villageId: villageAId },
      }),
    ).resolves.toMatchObject({ used: 10 });
    await expect(
      ctx.prisma.resourceStock.findUniqueOrThrow({
        where: { villageId: villageBId },
      }),
    ).resolves.toMatchObject({
      wood: targetBefore.wood,
      stone: targetBefore.stone,
      iron: targetBefore.iron,
    });
    await expect(
      ctx.prisma.eventOutbox.findFirst({
        where: { kind: 'caravan.arrived', aggregateId: villageBId },
      }),
    ).resolves.toBeNull();
    await expect(
      ctx.prisma.eventOutbox.findFirst({
        where: {
          kind: 'expedition.recalled',
          aggregateId: { in: [villageAId, villageBId] },
        },
      }),
    ).resolves.toBeNull();
    await expect(
      ctx.prisma.eventOutbox.findFirst({
        where: { kind: 'caravan.recalled', aggregateId: villageAId },
      }),
    ).resolves.not.toBeNull();
  }, 60_000);
});
