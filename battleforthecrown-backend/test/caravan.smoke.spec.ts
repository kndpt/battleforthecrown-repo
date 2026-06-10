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
      data: {
        wood: 2940,
        stone: 2940,
        iron: 3000,
        maxPerType: 3000,
        lastUpdateTs: new Date(Date.now() - 60 * 60 * 1000),
      },
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
      iron: 3000,
    });

    const arrivedEvent = await ctx.prisma.eventOutbox.findFirstOrThrow({
      where: { kind: 'caravan.arrived', aggregateId: villageBId },
      orderBy: { createdAt: 'desc' },
    });
    expect(arrivedEvent.payload).toMatchObject({
      credited: { wood: 0, stone: 0, iron: 0 },
      lost: { wood: 200, stone: 50, iron: 0 },
    });

    const arrivedReport = await ctx.prisma.caravanReport.findFirstOrThrow({
      where: { worldId: world.id, expeditionId, type: 'ARRIVED' },
    });
    expect(arrivedReport).toMatchObject({
      originVillageId: villageAId,
      targetVillageId: villageBId,
      resources: { wood: 200, stone: 50, iron: 0 },
      credited: { wood: 0, stone: 0, iron: 0 },
      returned: { wood: 0, stone: 0, iron: 0 },
      lost: { wood: 200, stone: 50, iron: 0 },
      porters: 1,
      recalled: false,
    });
    const arrivedEntry = await ctx.prisma.inboxEntry.findFirstOrThrow({
      where: {
        userId: userA.userId,
        worldId: world.id,
        kind: 'CARAVAN',
        caravanReportId: arrivedReport.id,
      },
    });
    expect(arrivedEntry).toMatchObject({ isRead: false, hidden: false });

    const listRes = await request(ctx.server)
      .get('/combat/caravan-reports')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .set('x-world-id', world.id);
    expect(listRes.status).toBe(200);
    expect(
      (
        listRes.body as Array<{
          id: string;
          type: string;
          isRead: boolean;
          originVillageId: string;
          targetVillageId: string;
        }>
      ).find((report) => report.id === arrivedReport.id),
    ).toMatchObject({
      type: 'ARRIVED',
      isRead: false,
      originVillageId: villageAId,
      targetVillageId: villageBId,
    });

    const readRes = await request(ctx.server)
      .patch(`/combat/caravan-report/${arrivedReport.id}/read`)
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .set('x-world-id', world.id);
    expect(readRes.status).toBeLessThan(300);
    expect(readRes.body).toMatchObject({ id: arrivedReport.id, isRead: true });

    const detailRes = await request(ctx.server)
      .get(`/combat/caravan-report/${arrivedReport.id}`)
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .set('x-world-id', world.id);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body).toMatchObject({
      id: arrivedReport.id,
      type: 'ARRIVED',
      isRead: true,
      resources: { wood: 200, stone: 50, iron: 0 },
      lost: { wood: 200, stone: 50, iron: 0 },
    });

    const deleteRes = await request(ctx.server)
      .delete(`/combat/caravan-report/${arrivedReport.id}`)
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .set('x-world-id', world.id);
    expect(deleteRes.status).toBeLessThan(300);
    await expect(
      ctx.prisma.inboxEntry.findUniqueOrThrow({
        where: { id: arrivedEntry.id },
      }),
    ).resolves.toMatchObject({ hidden: true });
    await expect(
      ctx.prisma.caravanReport.findUnique({
        where: { id: arrivedReport.id },
      }),
    ).resolves.not.toBeNull();

    const readHiddenRes = await request(ctx.server)
      .patch(`/combat/caravan-report/${arrivedReport.id}/read`)
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .set('x-world-id', world.id);
    expect(readHiddenRes.status).toBe(404);

    const deleteHiddenRes = await request(ctx.server)
      .delete(`/combat/caravan-report/${arrivedReport.id}`)
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .set('x-world-id', world.id);
    expect(deleteHiddenRes.status).toBe(404);

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
    await expect(
      ctx.prisma.caravanReport.findMany({
        where: { worldId: world.id, expeditionId },
        orderBy: { type: 'asc' },
      }),
    ).resolves.toMatchObject([{ type: 'ARRIVED' }]);

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

  it('catches up origin production before checking and debiting the caravan stock', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const userA = await registerUser(
      ctx.server,
      'caravan-origin-catchup-a' + Date.now(),
    );
    const joinA = await joinWorld(
      ctx.server,
      userA.accessToken,
      world.id,
      'caravan-origin-catchup-a',
    );
    const villageAId = joinA.village.id;
    const userB = await registerUser(
      ctx.server,
      'caravan-origin-catchup-b' + Date.now(),
    );
    const joinB = await joinWorld(
      ctx.server,
      userB.accessToken,
      world.id,
      'caravan-origin-catchup-b',
    );
    const villageBId = joinB.village.id;
    await ctx.prisma.village.update({
      where: { id: villageBId },
      data: { userId: userA.userId },
    });
    await ctx.prisma.resourceStock.update({
      where: { villageId: villageAId },
      data: {
        wood: 40,
        stone: 0,
        iron: 0,
        lastUpdateTs: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    });
    await ctx.prisma.population.update({
      where: { villageId: villageAId },
      data: { used: 0, max: 20 },
    });

    const res = await request(ctx.server)
      .post('/combat/caravan')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({
        villageId: villageAId,
        targetVillageId: villageBId,
        resources: { wood: 100, stone: 0, iron: 0 },
      });

    expect(res.status).toBeLessThan(300);
    const originAfterSend = await ctx.prisma.resourceStock.findUniqueOrThrow({
      where: { villageId: villageAId },
    });
    expect(originAfterSend.wood).toBeGreaterThanOrEqual(0);
    expect(originAfterSend.wood).toBeLessThan(100);
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
        x: joinA.village.x + 5000,
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
    const firstExpeditionId = (first.body as { id: string }).id;

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
    await expect(
      ctx.prisma.caravanReport.count({
        where: { worldId: world.id, expeditionId: firstExpeditionId },
      }),
    ).resolves.toBe(0);
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

  it('recalls a caravan en route, restores resources on return, and does not credit target', async () => {
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
    await ctx.prisma.expedition.update({
      where: { id: expeditionId },
      data: { departAt: new Date(Date.now() - 1_000) },
    });

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
    ).resolves.toMatchObject({ wood: 500, stone: 0, iron: 0 });
    await expect(
      ctx.prisma.population.findUniqueOrThrow({
        where: { villageId: villageAId },
      }),
    ).resolves.toMatchObject({ used: 11 });
    await ctx.prisma.village.update({
      where: { id: villageBId },
      data: { userId: userB.userId },
    });
    await ctx.prisma.resourceStock.update({
      where: { villageId: villageAId },
      data: {
        wood: 3000,
        stone: 0,
        iron: 0,
        maxPerType: 3000,
        lastUpdateTs: new Date(),
      },
    });

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
    ).resolves.toMatchObject({ wood: 3000, stone: 0, iron: 0 });
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
    const returnedEvent = await ctx.prisma.eventOutbox.findFirstOrThrow({
      where: { kind: 'caravan.returned', aggregateId: villageAId },
      orderBy: { createdAt: 'desc' },
    });
    expect(returnedEvent.payload).toMatchObject({
      resources: { wood: 0, stone: 0, iron: 0 },
      recalled: true,
    });
    const returnedReport = await ctx.prisma.caravanReport.findFirstOrThrow({
      where: { worldId: world.id, expeditionId, type: 'RETURNED' },
    });
    expect(returnedReport).toMatchObject({
      originVillageId: villageAId,
      targetVillageId: villageBId,
      resources: { wood: 500, stone: 0, iron: 0 },
      credited: { wood: 0, stone: 0, iron: 0 },
      returned: { wood: 0, stone: 0, iron: 0 },
      lost: { wood: 500, stone: 0, iron: 0 },
      porters: 1,
      recalled: true,
    });
    await expect(
      ctx.prisma.inboxEntry.findFirst({
        where: {
          userId: userA.userId,
          worldId: world.id,
          kind: 'CARAVAN',
          caravanReportId: returnedReport.id,
          hidden: false,
        },
      }),
    ).resolves.not.toBeNull();
    await expect(
      ctx.prisma.inboxEntry.findFirst({
        where: {
          userId: userB.userId,
          worldId: world.id,
          kind: 'CARAVAN',
          caravanReportId: returnedReport.id,
          hidden: false,
        },
      }),
    ).resolves.toBeNull();
    const returnedListRes = await request(ctx.server)
      .get('/combat/caravan-reports')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .set('x-world-id', world.id);
    expect(returnedListRes.status).toBe(200);
    expect(
      (returnedListRes.body as Array<{ id: string; type: string }>).filter(
        (report) => report.id === returnedReport.id,
      ),
    ).toMatchObject([{ type: 'RETURNED' }]);
    await expect(
      ctx.prisma.caravanReport.findMany({
        where: { worldId: world.id, expeditionId },
        orderBy: { type: 'asc' },
      }),
    ).resolves.toMatchObject([{ type: 'RETURNED' }]);
  }, 60_000);
});
