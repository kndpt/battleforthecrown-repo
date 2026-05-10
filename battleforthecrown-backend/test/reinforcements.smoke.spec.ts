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

describe('reinforcements smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await truncateAll(ctx.prisma);
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
});
