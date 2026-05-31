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

async function getVillagePower(
  server: SmokeContext['server'],
  accessToken: string,
  villageId: string,
): Promise<{ army: number }> {
  const res = await request(server)
    .get('/power')
    .query({ villageId })
    .set('Authorization', `Bearer ${accessToken}`);
  expect(res.status).toBe(200);
  return res.body as { army: number };
}

describe('reinforcements smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('full flow: reinforce → station → defend with losses → recall', async () => {
    const world = await seedSmokeWorld(ctx.prisma);

    // 1. Setup Player A (Sender)
    const userA = await registerUser(ctx.server, 'a' + Date.now());
    const joinA = await joinWorld(
      ctx.server,
      userA.accessToken,
      world.id,
      'village-a',
    );
    const villageAId = joinA.village.id;

    // 2. Setup Player B (Host)
    const userB = await registerUser(ctx.server, 'b' + Date.now());
    const joinB = await joinWorld(
      ctx.server,
      userB.accessToken,
      world.id,
      'village-b',
    );
    const villageBId = joinB.village.id;

    // 3. Give Player A some units and population
    await ctx.prisma.unitInventory.create({
      data: { villageId: villageAId, unitType: 'MILITIA', quantity: 100 },
    });
    await ctx.prisma.population.update({
      where: { villageId: villageAId },
      data: { used: 100, max: 200 }, // 100 militia = 100 pop
    });

    const powerBeforeReinforce = await getVillagePower(
      ctx.server,
      userA.accessToken,
      villageAId,
    );
    expect(powerBeforeReinforce.army).toBe(200);

    // 4. Player A reinforces Player B
    // Fix: Make village B owned by user A for the "inter-villages" rule
    await ctx.prisma.village.update({
      where: { id: villageBId },
      data: { userId: userA.userId },
    });

    const reinforceRes = await request(ctx.server)
      .post('/combat/reinforce')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({
        villageId: villageAId,
        targetVillageId: villageBId,
        units: { MILITIA: 60 },
      });
    expect(reinforceRes.status).toBeLessThan(300);

    const powerAfterReinforceDispatch = await getVillagePower(
      ctx.server,
      userA.accessToken,
      villageAId,
    );
    expect(powerAfterReinforceDispatch.army).toBe(powerBeforeReinforce.army);

    // 5. Wait for arrival at village B
    await waitFor(
      () =>
        ctx.prisma.garrison.findFirst({
          where: {
            villageId: villageBId,
            originVillageId: villageAId,
            quantity: 60,
          },
        }),
      { timeoutMs: 30_000 },
    );

    const powerAfterStationing = await getVillagePower(
      ctx.server,
      userA.accessToken,
      villageAId,
    );
    expect(powerAfterStationing.army).toBe(powerBeforeReinforce.army);
    const hostPowerAfterStationing = await getVillagePower(
      ctx.server,
      userA.accessToken,
      villageBId,
    );
    expect(hostPowerAfterStationing.army).toBe(0);

    // 6. Setup Player C (Attacker) to attack village B
    const userC = await registerUser(ctx.server, 'c' + Date.now());
    const joinC = await joinWorld(
      ctx.server,
      userC.accessToken,
      world.id,
      'village-c',
    );
    const villageCId = joinC.village.id;

    await ctx.prisma.unitInventory.create({
      data: { villageId: villageCId, unitType: 'MILITIA', quantity: 200 },
    });
    // Ensure B is in vision for C
    await ctx.prisma.village.update({
      where: { id: villageCId },
      data: { x: joinB.village.x + 1, y: joinB.village.y },
    });
    await ctx.prisma.building.updateMany({
      where: { villageId: villageCId, type: 'WATCHTOWER' },
      data: { level: 1 },
    });

    // Attack B with C
    const attackRes = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${userC.accessToken}`)
      .send({
        villageId: villageCId,
        targetX: joinB.village.x,
        targetY: joinB.village.y,
        targetKind: 'PLAYER_VILLAGE',
        targetRefId: villageBId,
        units: { MILITIA: 200 },
      });
    expect(attackRes.status).toBeLessThan(300);

    // 7. Wait for battle resolution
    await outboxDispatched(
      ctx.prisma,
      { kind: 'battle.resolved', aggregateId: villageCId },
      { timeoutMs: 30_000 },
    );

    const attackedEvent = await ctx.prisma.eventOutbox.findFirstOrThrow({
      where: { kind: 'village.attacked', aggregateId: villageBId },
      orderBy: { createdAt: 'desc' },
    });
    expect(
      (attackedEvent.payload as { reinforcementOriginVillageIds?: string[] })
        .reinforcementOriginVillageIds,
    ).toContain(villageAId);

    // 8. Verify losses distributed to Garrison
    const garrisonAfter = await ctx.prisma.garrison.findFirst({
      where: { villageId: villageBId, originVillageId: villageAId },
    });
    expect(garrisonAfter?.quantity).toBe(0);

    // 9. Verify population of A is freed
    const popA = await ctx.prisma.population.findUniqueOrThrow({
      where: { villageId: villageAId },
    });
    expect(popA.used).toBe(40);

    const powerAfterReinforcementLosses = await getVillagePower(
      ctx.server,
      userA.accessToken,
      villageAId,
    );
    expect(powerAfterReinforcementLosses.army).toBe(80);

    // 10. Test Recall (send some more units first)
    await ctx.prisma.garrison.update({
      where: { id: garrisonAfter!.id },
      data: { quantity: 40 },
    });
    await ctx.prisma.population.update({
      where: { villageId: villageAId },
      data: { used: 80 },
    });

    const recallRes = await request(ctx.server)
      .post('/combat/recall')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({
        villageId: villageBId,
        originVillageId: villageAId,
        units: { MILITIA: 40 },
      });
    expect(recallRes.status).toBeLessThan(300);

    // Wait for return to A
    await waitFor(
      () =>
        ctx.prisma.unitInventory
          .findUnique({
            where: {
              villageId_unitType: {
                villageId: villageAId,
                unitType: 'MILITIA',
              },
            },
          })
          .then((inv) => inv?.quantity === 80),
      { timeoutMs: 30_000 },
    );

    const finalGarrison = await ctx.prisma.garrison.findUnique({
      where: { id: garrisonAfter!.id },
    });
    expect(finalGarrison?.quantity).toBe(0);
  }, 60_000);

  it('produces STATIONED/RETURNED reinforcement reports + inbox entries exposed per recipient via REST', async () => {
    const world = await seedSmokeWorld(ctx.prisma);

    // 1. Setup userA, join → villageA
    const userA = await registerUser(ctx.server, 'rpt-a' + Date.now());
    const joinA = await joinWorld(
      ctx.server,
      userA.accessToken,
      world.id,
      'rpt-village-a',
    );
    const villageAId = joinA.village.id;

    // 2. Join with a second slot to get villageB, then transfer ownership to userA
    const userBTmp = await registerUser(ctx.server, 'rpt-b' + Date.now());
    const joinB = await joinWorld(
      ctx.server,
      userBTmp.accessToken,
      world.id,
      'rpt-village-b',
    );
    const villageBId = joinB.village.id;
    await ctx.prisma.village.update({
      where: { id: villageBId },
      data: { userId: userA.userId },
    });

    // 3. Give userA units + population on villageA
    await ctx.prisma.unitInventory.create({
      data: { villageId: villageAId, unitType: 'MILITIA', quantity: 30 },
    });
    await ctx.prisma.population.update({
      where: { villageId: villageAId },
      data: { used: 30, max: 200 },
    });

    // 4. POST /combat/reinforce A→B { MILITIA: 30 }
    const reinforceRes = await request(ctx.server)
      .post('/combat/reinforce')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({
        villageId: villageAId,
        targetVillageId: villageBId,
        units: { MILITIA: 30 },
      });
    expect(reinforceRes.status).toBeLessThan(300);

    // 5. Wait for garrison arrival at B
    await waitFor(
      () =>
        ctx.prisma.garrison.findFirst({
          where: {
            villageId: villageBId,
            originVillageId: villageAId,
            quantity: 30,
          },
        }),
      { timeoutMs: 30_000 },
    );

    // 6. Assert DB: STATIONED ReinforcementReport exists
    const stationedReport =
      await ctx.prisma.reinforcementReport.findFirstOrThrow({
        where: {
          worldId: world.id,
          type: 'STATIONED',
          originVillageId: villageAId,
          hostVillageId: villageBId,
        },
      });

    // 7. Assert DB: InboxEntry for userA exists, unread, not hidden
    const stationedEntry = await ctx.prisma.inboxEntry.findFirstOrThrow({
      where: {
        userId: userA.userId,
        reinforcementReportId: stationedReport.id,
        kind: 'REINFORCEMENT',
      },
    });
    expect(stationedEntry.isRead).toBe(false);
    expect(stationedEntry.hidden).toBe(false);

    // 8. Assert REST list: GET /combat/reinforcement-reports contains STATIONED report
    const listRes = await request(ctx.server)
      .get('/combat/reinforcement-reports')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .set('x-world-id', world.id);
    expect(listRes.status).toBe(200);
    const stationedInList = (
      listRes.body as Array<{
        type: string;
        id: string;
        isRead: boolean;
        originVillageId: string;
        hostVillageId: string;
      }>
    ).find((r) => r.id === stationedReport.id);
    expect(stationedInList).toBeDefined();
    expect(stationedInList!.type).toBe('STATIONED');
    expect(stationedInList!.isRead).toBe(false);
    expect(stationedInList!.originVillageId).toBe(villageAId);
    expect(stationedInList!.hostVillageId).toBe(villageBId);

    // 9. PATCH /combat/reinforcement-report/:id/read → mark as read
    const readRes = await request(ctx.server)
      .patch(`/combat/reinforcement-report/${stationedReport.id}/read`)
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .set('x-world-id', world.id);
    expect(readRes.status).toBeLessThan(300);

    // 10. GET detail → isRead === true
    const detailRes = await request(ctx.server)
      .get(`/combat/reinforcement-report/${stationedReport.id}`)
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .set('x-world-id', world.id);
    expect(detailRes.status).toBe(200);
    expect((detailRes.body as { isRead: boolean }).isRead).toBe(true);

    // 11. Verify InboxEntry in DB is now isRead === true
    const entryAfterRead = await ctx.prisma.inboxEntry.findUniqueOrThrow({
      where: { id: stationedEntry.id },
    });
    expect(entryAfterRead.isRead).toBe(true);

    // 12. Recall: POST /combat/recall B→A { MILITIA: 30 }
    const recallRes = await request(ctx.server)
      .post('/combat/recall')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({
        villageId: villageBId,
        originVillageId: villageAId,
        units: { MILITIA: 30 },
      });
    expect(recallRes.status).toBeLessThan(300);

    // 13. Wait for RETURNED report to appear
    await waitFor(
      () =>
        ctx.prisma.reinforcementReport.findFirst({
          where: {
            worldId: world.id,
            type: 'RETURNED',
            originVillageId: villageAId,
            hostVillageId: villageBId,
          },
        }),
      { timeoutMs: 30_000 },
    );

    // 14. Assert RETURNED report + InboxEntry for userA
    const returnedReport =
      await ctx.prisma.reinforcementReport.findFirstOrThrow({
        where: {
          worldId: world.id,
          type: 'RETURNED',
          originVillageId: villageAId,
          hostVillageId: villageBId,
        },
      });
    expect(returnedReport.actorUserId).toBe(userA.userId);

    const returnedEntry = await ctx.prisma.inboxEntry.findFirstOrThrow({
      where: {
        userId: userA.userId,
        reinforcementReportId: returnedReport.id,
        kind: 'REINFORCEMENT',
      },
    });
    expect(returnedEntry.isRead).toBe(false);
    expect(returnedEntry.hidden).toBe(false);

    // 15. DELETE /combat/reinforcement-report/:stationedId → soft-delete (hidden)
    const deleteRes = await request(ctx.server)
      .delete(`/combat/reinforcement-report/${stationedReport.id}`)
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .set('x-world-id', world.id);
    expect(deleteRes.status).toBeLessThan(300);

    // 16. Assert InboxEntry is now hidden, but ReinforcementReport still exists
    const entryAfterDelete = await ctx.prisma.inboxEntry.findUniqueOrThrow({
      where: { id: stationedEntry.id },
    });
    expect(entryAfterDelete.hidden).toBe(true);

    const reportStillExists = await ctx.prisma.reinforcementReport.findUnique({
      where: { id: stationedReport.id },
    });
    expect(reportStillExists).not.toBeNull();

    // 17. GET list no longer contains the deleted STATIONED report
    const listAfterDelete = await request(ctx.server)
      .get('/combat/reinforcement-reports')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .set('x-world-id', world.id);
    expect(listAfterDelete.status).toBe(200);
    const stillPresent = (listAfterDelete.body as Array<{ id: string }>).find(
      (r) => r.id === stationedReport.id,
    );
    expect(stillPresent).toBeUndefined();
  }, 60_000);

  it('send-back foreign reinforcement from host creates return expedition', async () => {
    const world = await seedSmokeWorld(ctx.prisma);

    const hostUser = await registerUser(ctx.server, 'host' + Date.now());
    const hostJoin = await joinWorld(
      ctx.server,
      hostUser.accessToken,
      world.id,
      'host-village',
    );
    const hostVillageId = hostJoin.village.id;

    const originUser = await registerUser(ctx.server, 'origin' + Date.now());
    const originJoin = await joinWorld(
      ctx.server,
      originUser.accessToken,
      world.id,
      'origin-village',
    );
    const originVillageId = originJoin.village.id;

    await ctx.prisma.village.update({
      where: { id: hostVillageId },
      data: { x: originJoin.village.x + 1, y: originJoin.village.y },
    });

    await ctx.prisma.garrison.create({
      data: {
        villageId: hostVillageId,
        originVillageId,
        unitType: 'MILITIA',
        quantity: 25,
      },
    });

    const sendBackRes = await request(ctx.server)
      .post('/combat/recall')
      .set('Authorization', `Bearer ${hostUser.accessToken}`)
      .send({
        villageId: hostVillageId,
        originVillageId,
        units: { MILITIA: 25 },
      });
    expect(sendBackRes.status).toBeLessThan(300);

    const expedition = await ctx.prisma.expedition.findFirstOrThrow({
      where: {
        attackerVillageId: hostVillageId,
        reinforcementOriginVillageId: originVillageId,
        kind: 'REINFORCE',
        targetRefId: originVillageId,
      },
    });
    expect(expedition.status).toBe('EN_ROUTE');
    expect(expedition.targetX).toBe(originJoin.village.x);
    expect(expedition.targetY).toBe(originJoin.village.y);

    const recalled = await outboxDispatched(
      ctx.prisma,
      { kind: 'reinforcement.recalled', aggregateId: hostVillageId },
      { timeoutMs: 30_000 },
    );
    expect((recalled.payload as { expeditionId?: string }).expeditionId).toBe(
      expedition.id,
    );

    const hostGarrison = await ctx.prisma.garrison.findUnique({
      where: {
        villageId_originVillageId_unitType: {
          villageId: hostVillageId,
          originVillageId,
          unitType: 'MILITIA',
        },
      },
    });
    expect(hostGarrison?.quantity).toBe(0);

    await outboxDispatched(
      ctx.prisma,
      { kind: 'reinforcement.returned', aggregateId: originVillageId },
      { timeoutMs: 30_000 },
    );

    const returnedInventory = await ctx.prisma.unitInventory.findUniqueOrThrow({
      where: {
        villageId_unitType: {
          villageId: originVillageId,
          unitType: 'MILITIA',
        },
      },
    });
    expect(returnedInventory.quantity).toBe(25);

    const intruder = await registerUser(ctx.server, 'intruder' + Date.now());
    const forbiddenRes = await request(ctx.server)
      .post('/combat/recall')
      .set('Authorization', `Bearer ${intruder.accessToken}`)
      .send({
        villageId: hostVillageId,
        originVillageId,
        units: { MILITIA: 1 },
      });
    expect(forbiddenRes.status).toBe(403);
  }, 60_000);
});
