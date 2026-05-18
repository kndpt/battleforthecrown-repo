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
