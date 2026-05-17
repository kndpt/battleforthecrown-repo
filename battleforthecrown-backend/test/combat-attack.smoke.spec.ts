import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  outboxDispatched,
  registerUser,
  seedSmokeWorld,
  truncateAll,
  type SmokeContext,
} from './helpers';
import { SMOKE_WORLD_CONFIG } from './fixtures/smoke-world-config';

async function getVillagePower(
  server: SmokeContext['server'],
  accessToken: string,
  villageId: string,
): Promise<{ army: number; total: number }> {
  const res = await request(server)
    .get('/power')
    .query({ villageId })
    .set('Authorization', `Bearer ${accessToken}`);
  expect(res.status).toBe(200);
  return res.body as { army: number; total: number };
}

describe('combat attack smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await truncateAll(ctx.prisma);
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('combat: attack a barbarian → battle.resolved + battle.returned dispatched', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'attacker',
    );
    const attackerId = join.village.id;

    const barbarian = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        isBarbarian: true,
        name: 'barb-target',
        x: join.village.x + 5,
        y: join.village.y,
        tier: 'T1',
        resourceStock: {
          create: { wood: 500, stone: 500, iron: 500, maxPerType: 100_000 },
        },
      },
    });

    await ctx.prisma.unitInventory.create({
      data: { villageId: attackerId, unitType: 'MILITIA', quantity: 100 },
    });
    await ctx.prisma.unitInventory.create({
      data: { villageId: barbarian.id, unitType: 'MILITIA', quantity: 10 },
    });

    // Fog of war: target must be in vision. Bump watchtower to lvl 1 (radius 5).
    await ctx.prisma.building.updateMany({
      where: { villageId: attackerId, type: 'WATCHTOWER' },
      data: { level: 1 },
    });

    const powerBefore = await getVillagePower(
      ctx.server,
      user.accessToken,
      attackerId,
    );
    expect(powerBefore.army).toBe(200);

    const res = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        villageId: attackerId,
        targetX: barbarian.x,
        targetY: barbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: barbarian.id,
        units: { MILITIA: 100 },
      });
    expect(res.status).toBeLessThan(300);

    const powerAfterDispatch = await getVillagePower(
      ctx.server,
      user.accessToken,
      attackerId,
    );
    expect(powerAfterDispatch.army).toBe(powerBefore.army);

    const outbound = await ctx.prisma.expedition.findFirstOrThrow({
      where: { attackerVillageId: attackerId, status: 'EN_ROUTE' },
    });
    expect(outbound.outboundTravelMs).toBe(
      outbound.arrivalAt.getTime() - outbound.departAt.getTime(),
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
              travelSpeed: 0.000001,
            },
          },
        },
      },
    });

    const resolved = await outboxDispatched(
      ctx.prisma,
      { kind: 'battle.resolved', aggregateId: attackerId },
      { timeoutMs: 15_000 },
    );
    expect(resolved?.dispatchedAt).toBeTruthy();

    const powerAfterLosses = await getVillagePower(
      ctx.server,
      user.accessToken,
      attackerId,
    );
    expect(powerAfterLosses.army).toBe(180);

    const returning = await ctx.prisma.expedition.findUniqueOrThrow({
      where: { id: outbound.id },
      include: { report: true },
    });
    expect(
      (returning.report?.lossesAttacker as Record<string, number>).MILITIA,
    ).toBe(10);
    expect(
      (returning.report?.lossesDefender as Record<string, number>).MILITIA,
    ).toBe(10);
    const reportDetails = returning.report?.details as {
      travelTime?: number;
    };
    expect(reportDetails.travelTime).toBeLessThan(outbound.outboundTravelMs);
    expect(returning.returnAt?.getTime() ?? 0).toBeGreaterThanOrEqual(
      (returning.report?.createdAt.getTime() ?? 0) +
        outbound.outboundTravelMs -
        500,
    );
    expect(returning.returnAt?.getTime() ?? 0).toBeLessThanOrEqual(
      (returning.report?.createdAt.getTime() ?? 0) +
        outbound.outboundTravelMs +
        1_500,
    );

    const returned = await outboxDispatched(
      ctx.prisma,
      { kind: 'battle.returned', aggregateId: attackerId },
      { timeoutMs: 15_000 },
    );
    expect(returned?.dispatchedAt).toBeTruthy();

    const powerAfterReturn = await getVillagePower(
      ctx.server,
      user.accessToken,
      attackerId,
    );
    expect(powerAfterReturn.army).toBe(powerAfterLosses.army);

    const defenderInventory = await ctx.prisma.unitInventory.findUniqueOrThrow({
      where: {
        villageId_unitType: {
          villageId: barbarian.id,
          unitType: 'MILITIA',
        },
      },
    });
    expect(defenderInventory.quantity).toBe(0);

    const attackerInventory = await ctx.prisma.unitInventory.findUniqueOrThrow({
      where: {
        villageId_unitType: { villageId: attackerId, unitType: 'MILITIA' },
      },
    });
    expect(attackerInventory.quantity).toBe(90);
  });

  it('combat: total attacker loss resolves without empty return expedition', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'attacker-total-loss',
    );
    const attackerId = join.village.id;

    const barbarian = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        isBarbarian: true,
        name: 'barb-total-loss-target',
        x: join.village.x + 1,
        y: join.village.y,
        tier: 'T1',
        resourceStock: {
          create: { wood: 500, stone: 500, iron: 500, maxPerType: 100_000 },
        },
      },
    });

    await ctx.prisma.unitInventory.create({
      data: { villageId: attackerId, unitType: 'MILITIA', quantity: 1 },
    });
    await ctx.prisma.unitInventory.create({
      data: { villageId: barbarian.id, unitType: 'MILITIA', quantity: 100 },
    });
    await ctx.prisma.building.updateMany({
      where: { villageId: attackerId, type: 'WATCHTOWER' },
      data: { level: 1 },
    });

    const res = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        villageId: attackerId,
        targetX: barbarian.x,
        targetY: barbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: barbarian.id,
        units: { MILITIA: 1 },
      });
    expect(res.status).toBeLessThan(300);
    const attackBody = res.body as { id: string };

    await ctx.prisma.world.update({
      where: { id: world.id },
      data: {
        config: {
          ...SMOKE_WORLD_CONFIG,
          tempo: {
            ...SMOKE_WORLD_CONFIG.tempo,
            overrides: {
              ...SMOKE_WORLD_CONFIG.tempo.overrides,
              travelSpeed: 0.000001,
            },
          },
        },
      },
    });

    const resolved = await outboxDispatched(
      ctx.prisma,
      { kind: 'battle.resolved', aggregateId: attackerId },
      { timeoutMs: 15_000 },
    );
    expect(resolved?.dispatchedAt).toBeTruthy();
    expect(resolved.payload).toMatchObject({
      expeditionId: attackBody.id,
      isVictory: false,
      survivingUnits: {},
      returnAt: null,
    });

    const expedition = await ctx.prisma.expedition.findUniqueOrThrow({
      where: { id: attackBody.id },
    });
    expect(expedition.status).toBe('RESOLVED');
    expect(expedition.returnAt).toBeNull();

    const openRes = await request(ctx.server)
      .get(`/combat/expeditions/open?worldId=${world.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`);
    expect(openRes.status).toBe(200);
    expect(openRes.body).toEqual([]);
  });

  it('combat: cavalry attack consumes archer defenseCavalry', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'attacker-defense-archetype',
    );
    const attackerId = join.village.id;

    const barbarian = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        isBarbarian: true,
        name: 'barb-anti-cav-target',
        x: join.village.x + 1,
        y: join.village.y,
        tier: 'T1',
        resourceStock: {
          create: { wood: 500, stone: 500, iron: 500, maxPerType: 100_000 },
        },
      },
    });

    await ctx.prisma.unitInventory.create({
      data: { villageId: attackerId, unitType: 'CAVALRY', quantity: 10 },
    });
    await ctx.prisma.unitInventory.create({
      data: { villageId: barbarian.id, unitType: 'ARCHER', quantity: 10 },
    });
    await ctx.prisma.building.updateMany({
      where: { villageId: attackerId, type: 'WATCHTOWER' },
      data: { level: 1 },
    });

    const res = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        villageId: attackerId,
        targetX: barbarian.x,
        targetY: barbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: barbarian.id,
        units: { CAVALRY: 10 },
      });
    expect(res.status).toBeLessThan(300);

    await ctx.prisma.world.update({
      where: { id: world.id },
      data: {
        config: {
          ...SMOKE_WORLD_CONFIG,
          tempo: {
            ...SMOKE_WORLD_CONFIG.tempo,
            overrides: {
              ...SMOKE_WORLD_CONFIG.tempo.overrides,
              travelSpeed: 0.000001,
            },
          },
        },
      },
    });

    const resolved = await outboxDispatched(
      ctx.prisma,
      { kind: 'battle.resolved', aggregateId: attackerId },
      { timeoutMs: 15_000 },
    );
    expect(resolved?.dispatchedAt).toBeTruthy();
    expect(resolved?.payload).toMatchObject({
      isVictory: false,
      lossesAttacker: { CAVALRY: 10 },
      survivingUnits: {},
      returnAt: null,
    });

    const report = await ctx.prisma.combatReport.findFirstOrThrow({
      where: { worldId: world.id, attackerVillageId: attackerId },
    });
    expect(report.lossesDefender).toMatchObject({ ARCHER: 7 });

    const defenderInventory = await ctx.prisma.unitInventory.findUniqueOrThrow({
      where: {
        villageId_unitType: {
          villageId: barbarian.id,
          unitType: 'ARCHER',
        },
      },
    });
    expect(defenderInventory.quantity).toBe(3);
  });

  it('combat: report deleted in-flight -> troops still return', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'attacker-del-report',
    );
    const attackerId = join.village.id;

    const barbarian = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        isBarbarian: true,
        name: 'barb-target-2',
        x: join.village.x + 1,
        y: join.village.y,
        tier: 'T1',
        resourceStock: {
          create: { wood: 500, stone: 500, iron: 500, maxPerType: 100_000 },
        },
      },
    });

    await ctx.prisma.unitInventory.create({
      data: { villageId: attackerId, unitType: 'MILITIA', quantity: 100 },
    });

    await ctx.prisma.building.updateMany({
      where: { villageId: attackerId, type: 'WATCHTOWER' },
      data: { level: 1 },
    });

    const stockBefore = await ctx.prisma.resourceStock.findUniqueOrThrow({
      where: { villageId: attackerId },
    });

    const res = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        villageId: attackerId,
        targetX: barbarian.x,
        targetY: barbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: barbarian.id,
        units: { MILITIA: 100 },
      });
    expect(res.status).toBeLessThan(300);

    const resolved = await outboxDispatched(
      ctx.prisma,
      { kind: 'battle.resolved', aggregateId: attackerId },
      { timeoutMs: 15_000 },
    );
    expect(resolved?.dispatchedAt).toBeTruthy();

    const report = await ctx.prisma.combatReport.findFirstOrThrow({
      where: { worldId: world.id, attackerVillageId: attackerId },
    });

    const deleteRes = await request(ctx.server)
      .delete(`/combat/report/${report.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`);
    expect(deleteRes.status).toBeLessThan(300);

    const returned = await outboxDispatched(
      ctx.prisma,
      { kind: 'battle.returned', aggregateId: attackerId },
      { timeoutMs: 15_000 },
    );
    expect(returned?.dispatchedAt).toBeTruthy();
    const returnedPayload = returned.payload as {
      reportId: string | null;
      loot: { resources: { wood: number; stone: number; iron: number } };
    };
    expect(returnedPayload.reportId).toBeNull();
    expect(returnedPayload.loot.resources.wood).toBeGreaterThan(0);
    expect(returnedPayload.loot.resources.stone).toBeGreaterThan(0);
    expect(returnedPayload.loot.resources.iron).toBeGreaterThan(0);

    const exp = await ctx.prisma.expedition.count({
      where: { attackerVillageId: attackerId },
    });
    expect(exp).toBe(0);

    const inv = await ctx.prisma.unitInventory.findUniqueOrThrow({
      where: {
        villageId_unitType: { villageId: attackerId, unitType: 'MILITIA' },
      },
    });
    expect(inv.quantity).toBe(100);

    const stockAfter = await ctx.prisma.resourceStock.findUniqueOrThrow({
      where: { villageId: attackerId },
    });
    expect(Number(stockAfter.wood)).toBeGreaterThan(Number(stockBefore.wood));
    expect(Number(stockAfter.stone)).toBeGreaterThan(Number(stockBefore.stone));
    expect(Number(stockAfter.iron)).toBeGreaterThan(Number(stockBefore.iron));
  });
});
