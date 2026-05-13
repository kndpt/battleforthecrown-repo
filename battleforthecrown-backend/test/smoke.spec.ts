import request from 'supertest';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
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
import { SMOKE_WORLD_CONFIG } from './fixtures/smoke-world-config';
import { ConquestService } from '../src/modules/combat/conquest.service';
import { BarbarianSeedingCatchupWorker } from '../src/modules/world/barbarian-seeding-catchup.worker';
import { BarbarianRuntimeService } from '../src/modules/world/barbarian-runtime.service';
import { BarbarianVillageFactory } from '../src/modules/world/barbarian-village.factory';

describe('smoke', () => {
  let ctx: SmokeContext;

  let port: number;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await truncateAll(ctx.prisma);
    await ctx.app.listen(0);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    port = (ctx.server.address() as { port: number }).port;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('production tick: ResourceStock.lastUpdateTs is bumped for active villages', async () => {
    // ProductionWorker does NOT emit resources.changed by design — frontend
    // interpolates between mutation-driven events (cf. production.worker.ts).
    // We assert on the DB side-effect (lastUpdateTs progression) instead.
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'tick-village',
    );
    const villageId = join.village.id;

    const before = await ctx.prisma.resourceStock.findUniqueOrThrow({
      where: { villageId },
    });
    await new Promise((r) => setTimeout(r, 1100));
    await ctx.boss.send('production:tick', {});

    await waitFor(
      async () => {
        const after = await ctx.prisma.resourceStock.findUniqueOrThrow({
          where: { villageId },
        });
        return after.lastUpdateTs > before.lastUpdateTs ? after : null;
      },
      { timeoutMs: 10_000 },
    );
  });

  it('construction: upgrade WOOD → Building.level=2 + building.completed dispatched', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'build-village',
    );
    const villageId = join.village.id;

    await ctx.prisma.resourceStock.update({
      where: { villageId },
      data: {
        wood: 1_000_000,
        stone: 1_000_000,
        iron: 1_000_000,
        maxPerType: 10_000_000,
      },
    });

    const res = await request(ctx.server)
      .post(`/village/${villageId}/upgrade`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ buildingType: 'WOOD' });
    expect(res.status).toBeLessThan(300);

    const upgradedBuilding = await waitFor(
      () =>
        ctx.prisma.building.findFirst({
          where: { villageId, type: 'WOOD', level: 2 },
        }),
      { timeoutMs: 10_000 },
    );

    const event = await outboxDispatched(
      ctx.prisma,
      { kind: 'building.completed', aggregateId: upgradedBuilding.id },
      { timeoutMs: 10_000 },
    );
    expect(event?.dispatchedAt).toBeTruthy();
  });

  it('training: train 1 MILITIA → UnitInventory + unit.training.completed dispatched', async () => {
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
      .send({ unitType: 'MILITIA', quantity: 1 });
    expect(res.status).toBeLessThan(300);

    await waitFor(
      () =>
        ctx.prisma.unitInventory.findFirst({
          where: { villageId, unitType: 'MILITIA', quantity: { gte: 1 } },
        }),
      { timeoutMs: 10_000 },
    );

    const event = await outboxDispatched(
      ctx.prisma,
      { kind: 'unit.training.completed', aggregateId: villageId },
      { timeoutMs: 10_000 },
    );
    expect(event?.dispatchedAt).toBeTruthy();
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
          gameSpeed: { ...SMOKE_WORLD_CONFIG.gameSpeed, travel: 1_000_000 },
        },
      },
    });

    const resolved = await outboxDispatched(
      ctx.prisma,
      { kind: 'battle.resolved', aggregateId: attackerId },
      { timeoutMs: 15_000 },
    );
    expect(resolved?.dispatchedAt).toBeTruthy();

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

  it('combat reports: list, read, and delete are scoped to the current participant', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const attacker = await registerUser(ctx.server);
    const defender = await registerUser(ctx.server);
    const attackerJoin = await joinWorld(
      ctx.server,
      attacker.accessToken,
      world.id,
      'report-attacker',
    );
    const defenderJoin = await joinWorld(
      ctx.server,
      defender.accessToken,
      world.id,
      'report-defender',
    );

    const older = await ctx.prisma.combatReport.create({
      data: {
        worldId: world.id,
        attackerUserId: attacker.userId,
        attackerVillageId: attackerJoin.village.id,
        targetKind: 'BARBARIAN_VILLAGE',
        targetX: 0,
        targetY: 0,
        loot: {},
        lossesAttacker: {},
        details: {},
        timestamp: new Date('2026-05-11T20:00:00.000Z'),
      },
    });
    const shared = await ctx.prisma.combatReport.create({
      data: {
        worldId: world.id,
        attackerUserId: attacker.userId,
        attackerVillageId: attackerJoin.village.id,
        defenderUserId: defender.userId,
        defenderVillageId: defenderJoin.village.id,
        targetKind: 'PLAYER_VILLAGE',
        targetX: defenderJoin.village.x,
        targetY: defenderJoin.village.y,
        loot: {},
        lossesAttacker: {},
        lossesDefender: {},
        details: {},
        timestamp: new Date('2026-05-11T21:00:00.000Z'),
      },
    });

    const list = await request(ctx.server)
      .get('/combat/reports')
      .set('Authorization', `Bearer ${attacker.accessToken}`);
    expect(list.status).toBeLessThan(300);
    const attackerReports = list.body as unknown as Array<{
      id: string;
      isRead: boolean;
    }>;
    expect(attackerReports.map((report) => report.id)).toEqual([
      shared.id,
      older.id,
    ]);
    expect(attackerReports[0].isRead).toBe(false);

    const attackerRead = await request(ctx.server)
      .patch(`/combat/report/${shared.id}/read`)
      .set('Authorization', `Bearer ${attacker.accessToken}`);
    expect(attackerRead.status).toBeLessThan(300);
    const attackerReadBody = attackerRead.body as unknown as {
      isRead: boolean;
    };
    expect(attackerReadBody.isRead).toBe(true);

    const defenderDetail = await request(ctx.server)
      .get(`/combat/report/${shared.id}`)
      .set('Authorization', `Bearer ${defender.accessToken}`);
    expect(defenderDetail.status).toBeLessThan(300);
    const defenderDetailBody = defenderDetail.body as unknown as {
      isRead: boolean;
    };
    expect(defenderDetailBody.isRead).toBe(false);

    const hideForAttacker = await request(ctx.server)
      .delete(`/combat/report/${shared.id}`)
      .set('Authorization', `Bearer ${attacker.accessToken}`);
    expect(hideForAttacker.status).toBeLessThan(300);

    const attackerListAfterDelete = await request(ctx.server)
      .get('/combat/reports')
      .set('Authorization', `Bearer ${attacker.accessToken}`);
    const attackerReportsAfterDelete =
      attackerListAfterDelete.body as unknown as Array<{ id: string }>;
    expect(
      attackerReportsAfterDelete.some((report) => report.id === shared.id),
    ).toBe(false);

    const defenderStillSeesIt = await request(ctx.server)
      .get(`/combat/report/${shared.id}`)
      .set('Authorization', `Bearer ${defender.accessToken}`);
    expect(defenderStillSeesIt.status).toBeLessThan(300);

    const hideForDefender = await request(ctx.server)
      .delete(`/combat/report/${shared.id}`)
      .set('Authorization', `Bearer ${defender.accessToken}`);
    expect(hideForDefender.status).toBeLessThan(300);
    await expect(
      ctx.prisma.combatReport.findUniqueOrThrow({ where: { id: shared.id } }),
    ).rejects.toThrow();
  });

  it('combat: cannot attack a target outside vision (blip non-attaquable)', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'fog-attacker',
    );
    const attackerId = join.village.id;

    // Barbarian placed far enough to be a blip (joiner has watchtower lvl 0 → radius 0).
    const barbarian = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        isBarbarian: true,
        name: 'fogged-target',
        x: join.village.x + 50,
        y: join.village.y + 50,
        tier: 'T1',
        resourceStock: {
          create: { wood: 0, stone: 0, iron: 0, maxPerType: 100_000 },
        },
      },
    });

    await ctx.prisma.unitInventory.create({
      data: { villageId: attackerId, unitType: 'MILITIA', quantity: 100 },
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
    expect(res.status).toBe(403);
  });

  it('scouting: SPY-only mission snapshots visible targets and returns spies', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const attacker = await registerUser(ctx.server);
    const defender = await registerUser(ctx.server, `scout-def-${Date.now()}`);
    const join = await joinWorld(
      ctx.server,
      attacker.accessToken,
      world.id,
      'scout-origin',
    );
    const attackerId = join.village.id;

    const barracks = await ctx.prisma.building.findFirstOrThrow({
      where: { villageId: attackerId, type: 'BARRACKS' },
    });
    await ctx.prisma.building.update({
      where: { id: barracks.id },
      data: { level: 2 },
    });
    await ctx.prisma.building.updateMany({
      where: { villageId: attackerId, type: 'WATCHTOWER' },
      data: { level: 1 },
    });
    await ctx.prisma.resourceStock.update({
      where: { villageId: attackerId },
      data: {
        wood: 100_000,
        stone: 100_000,
        iron: 100_000,
        maxPerType: 1_000_000,
      },
    });
    await ctx.prisma.population.update({
      where: { villageId: attackerId },
      data: { used: 0, max: 100 },
    });

    const lockedSpy = await request(ctx.server)
      .post(`/army/${attackerId}/train`)
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({ unitType: 'SPY', quantity: 1 });
    expect(lockedSpy.status).toBe(400);

    await ctx.prisma.building.update({
      where: { id: barracks.id },
      data: { level: 3 },
    });

    const trainSpy = await request(ctx.server)
      .post(`/army/${attackerId}/train`)
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({ unitType: 'SPY', quantity: 2 });
    expect(trainSpy.status).toBeLessThan(300);

    await waitFor(
      () =>
        ctx.prisma.unitInventory.findFirst({
          where: { villageId: attackerId, unitType: 'SPY', quantity: 2 },
        }),
      { timeoutMs: 10_000 },
    );

    const barbarian = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        isBarbarian: true,
        name: 'scout-barbarian',
        x: join.village.x + 1,
        y: join.village.y,
        tier: 'T1',
        resourceStock: {
          create: { wood: 321, stone: 222, iron: 123, maxPerType: 100_000 },
        },
      },
    });
    await ctx.prisma.unitInventory.create({
      data: { villageId: barbarian.id, unitType: 'MILITIA', quantity: 7 },
    });

    const playerTarget = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        userId: defender.userId,
        isBarbarian: false,
        name: 'scout-player',
        x: join.village.x + 2,
        y: join.village.y,
        resourceStock: {
          create: { wood: 456, stone: 345, iron: 234, maxPerType: 100_000 },
        },
        strategyConfig: { create: { strategy: 'RAIDERS' } },
      },
    });
    await ctx.prisma.unitInventory.create({
      data: { villageId: playerTarget.id, unitType: 'SQUIRE', quantity: 3 },
    });

    const publicVillages = await request(ctx.server)
      .get(`/world/${world.id}/villages`)
      .query({ centerX: join.village.x, centerY: join.village.y, radius: 5 })
      .set('Authorization', `Bearer ${attacker.accessToken}`);
    expect(publicVillages.status).toBe(200);
    const publicTarget = (
      publicVillages.body as Array<Record<string, unknown>>
    ).find((entity) => entity.id === playerTarget.id);
    expect(publicTarget).toBeTruthy();
    expect(JSON.stringify(publicTarget)).not.toContain('RAIDERS');

    const nonSpy = await request(ctx.server)
      .post('/combat/scout')
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({
        villageId: attackerId,
        targetX: barbarian.x,
        targetY: barbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: barbarian.id,
        units: { MILITIA: 1 },
      });
    expect(nonSpy.status).toBe(400);

    const scoutBarb = await request(ctx.server)
      .post('/combat/scout')
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({
        villageId: attackerId,
        targetX: barbarian.x,
        targetY: barbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: barbarian.id,
        units: { SPY: 1 },
      });
    expect(scoutBarb.status).toBeLessThan(300);
    const barbExpeditionId = (scoutBarb.body as { id: string }).id;

    await waitFor(
      async () => {
        const event = await ctx.prisma.eventOutbox.findFirst({
          where: { kind: 'scout.reported', aggregateId: attackerId },
          orderBy: { createdAt: 'desc' },
        });
        return event &&
          (event.payload as { expeditionId?: string }).expeditionId ===
            barbExpeditionId &&
          event.dispatchedAt
          ? event
          : null;
      },
      { timeoutMs: 15_000 },
    );

    const barbReport = await ctx.prisma.scoutReport.findFirstOrThrow({
      where: { scoutVillageId: attackerId, targetVillageId: barbarian.id },
    });
    expect((barbReport.units as Record<string, number>).MILITIA).toBe(7);
    expect((barbReport.resources as Record<string, number>).wood).toBe(321);
    expect(barbReport.strategy).toBeNull();

    await waitFor(
      async () => {
        const event = await ctx.prisma.eventOutbox.findFirst({
          where: { kind: 'scout.returned', aggregateId: attackerId },
          orderBy: { createdAt: 'desc' },
        });
        return event &&
          (event.payload as { expeditionId?: string }).expeditionId ===
            barbExpeditionId &&
          event.dispatchedAt
          ? event
          : null;
      },
      { timeoutMs: 15_000 },
    );

    const scoutPlayer = await request(ctx.server)
      .post('/combat/scout')
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({
        villageId: attackerId,
        targetX: playerTarget.x,
        targetY: playerTarget.y,
        targetKind: 'PLAYER_VILLAGE',
        targetRefId: playerTarget.id,
        units: { SPY: 1 },
      });
    expect(scoutPlayer.status).toBeLessThan(300);
    const playerExpeditionId = (scoutPlayer.body as { id: string }).id;

    await waitFor(
      async () => {
        const event = await ctx.prisma.eventOutbox.findFirst({
          where: { kind: 'scout.returned', aggregateId: attackerId },
          orderBy: { createdAt: 'desc' },
        });
        return event &&
          (event.payload as { expeditionId?: string }).expeditionId ===
            playerExpeditionId &&
          event.dispatchedAt
          ? event
          : null;
      },
      { timeoutMs: 15_000 },
    );

    const playerReport = await ctx.prisma.scoutReport.findFirstOrThrow({
      where: { scoutVillageId: attackerId, targetVillageId: playerTarget.id },
    });
    expect((playerReport.units as Record<string, number>).SQUIRE).toBe(3);
    expect((playerReport.resources as Record<string, number>).iron).toBe(234);
    expect(playerReport.strategy).toBe('RAIDERS');

    const farBarbarian = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        isBarbarian: true,
        name: 'scout-far-barbarian',
        x: join.village.x + 50,
        y: join.village.y + 50,
        tier: 'T1',
        resourceStock: {
          create: { wood: 0, stone: 0, iron: 0, maxPerType: 100_000 },
        },
      },
    });
    const outsideVision = await request(ctx.server)
      .post('/combat/scout')
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({
        villageId: attackerId,
        targetX: farBarbarian.x,
        targetY: farBarbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: farBarbarian.id,
        units: { SPY: 1 },
      });
    expect(outsideVision.status).toBe(403);

    const finalSpyInventory = await ctx.prisma.unitInventory.findUniqueOrThrow({
      where: {
        villageId_unitType: { villageId: attackerId, unitType: 'SPY' },
      },
    });
    expect(finalSpyInventory.quantity).toBe(2);
  });

  it('conquest: ConquestService → village.userId reassigned + village.conquered dispatched', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'conqueror',
    );
    const attackerId = join.village.id;

    const barbarian = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        isBarbarian: true,
        name: 'barb-conquer-target',
        x: join.village.x + 1,
        y: join.village.y,
        tier: 'T1',
        resourceStock: {
          create: { wood: 0, stone: 0, iron: 0, maxPerType: 100_000 },
        },
      },
    });

    const conquest = ctx.app.get(ConquestService);
    const result = await conquest.conquerVillage({
      attackerVillageId: attackerId,
      targetVillageId: barbarian.id,
      attackerUserId: user.userId,
    });
    expect(result.success).toBe(true);

    const conquered = await ctx.prisma.village.findUniqueOrThrow({
      where: { id: barbarian.id },
    });
    expect(conquered.userId).toBe(user.userId);

    const event = await outboxDispatched(
      ctx.prisma,
      { kind: 'village.conquered', aggregateId: barbarian.id },
      { timeoutMs: 5_000 },
    );
    expect(event?.dispatchedAt).toBeTruthy();
  });

  it('crown production: tick → crowns.changed dispatched for active membership', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    await joinWorld(ctx.server, user.accessToken, world.id, 'crown-village');

    // Backdate so the tick computes a non-zero production (event is gated on production > 0)
    await ctx.prisma.crownBalance.update({
      where: { userId_worldId: { userId: user.userId, worldId: world.id } },
      data: { lastUpdateTs: new Date(Date.now() - 86_400_000) },
    });

    await ctx.boss.send('crowns:production', {});

    const event = await outboxDispatched(
      ctx.prisma,
      { kind: 'crowns.changed', aggregateId: user.userId },
      { timeoutMs: 10_000 },
    );
    expect(event?.dispatchedAt).toBeTruthy();
  });

  it('crown production: tick → no crowns.changed when production rounds to 0', async () => {
    // Lock the inverse invariant of the previous test: when no crown was actually
    // produced (rate × elapsedHours < 1 → floor = 0), the worker must NOT emit
    // a crowns.changed event. The HUD is kept in sync by the REST seed +
    // client-side interpolation. cf. crowns.service.ts JSDoc.
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'crown-village-zero',
    );

    // No backdate — joinWorld sets lastUpdateTs to now, so elapsedHours ≈ 0.

    await ctx.boss.send('crowns:production', {});

    // Wait long enough for the worker to have processed the job (well past
    // the OutboxWorker poll interval) without seeing any crowns.changed for
    // this user.
    await new Promise((r) => setTimeout(r, 3_000));
    const event = await ctx.prisma.eventOutbox.findFirst({
      where: { kind: 'crowns.changed', aggregateId: user.userId },
    });
    expect(event).toBeNull();
  });

  it('strategy change: deducting crowns dispatches crowns.changed', async () => {
    // Locks the cross-module invariant documented in crowns.service.ts JSDoc:
    // any user-triggered mutation of CrownBalance.balance must emit its own
    // crowns.changed event — otherwise the HUD stays stale until the next
    // tick with production > 0.
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'strategy-village',
    );
    const villageId = join.village.id;

    await ctx.prisma.building.updateMany({
      where: { villageId, type: 'CASTLE' },
      data: { level: 4 },
    });
    await ctx.prisma.building.updateMany({
      where: { villageId, type: 'COUNCIL_HALL' },
      data: { level: 1 },
    });
    await ctx.prisma.resourceStock.update({
      where: { villageId },
      data: { wood: 1_000, stone: 1_000, iron: 1_000 },
    });

    // Give the user enough crowns to afford a paid first strategy change.
    await ctx.prisma.crownBalance.update({
      where: { userId_worldId: { userId: user.userId, worldId: world.id } },
      data: { balance: 10_000 },
    });

    const res = await request(ctx.server)
      .post(`/village/${villageId}/strategy`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ strategy: 'FORTRESS' });
    expect(res.status).toBeLessThan(300);
    expect(res.body).toMatchObject({
      cost: { wood: 200, stone: 100, iron: 50, crowns: 80 },
    });

    const event = await outboxDispatched(
      ctx.prisma,
      { kind: 'crowns.changed', aggregateId: user.userId },
      { timeoutMs: 10_000 },
    );
    expect(event?.dispatchedAt).toBeTruthy();
  });

  it('barbarian seeding catchup: enabled world → handleSeedingCatchup seeds new BVs around recent villages', async () => {
    const worldId = `smoke-bf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await ctx.prisma.world.create({
      data: {
        id: worldId,
        name: worldId,
        status: 'OPEN',
        config: {
          ...SMOKE_WORLD_CONFIG,
          barbarianSeeding: {
            ...SMOKE_WORLD_CONFIG.barbarianSeeding,
            enabled: true,
            targetMin: 1,
            targetMax: 2,
          },
        } as object,
      },
    });

    const user = await registerUser(ctx.server);
    await ctx.prisma.village.create({
      data: {
        worldId,
        userId: user.userId,
        name: 'recent-anchor',
        x: 50,
        y: 50,
      },
    });

    const before = await ctx.prisma.village.count({
      where: { worldId, isBarbarian: true },
    });
    await ctx.app.get(BarbarianSeedingCatchupWorker).handleSeedingCatchup();
    const after = await ctx.prisma.village.count({
      where: { worldId, isBarbarian: true },
    });

    expect(after).toBeGreaterThan(before);
  });

  it('barbarian runtime: factory persists troops and lazy catchup regenerates troops/resources', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const factory = ctx.app.get(BarbarianVillageFactory);
    const runtime = ctx.app.get(BarbarianRuntimeService);

    const barbarian = await ctx.prisma.$transaction((tx) =>
      factory.create(tx, {
        worldId: world.id,
        tier: 'T1',
        x: 320,
        y: 320,
      }),
    );

    const initialUnits = await ctx.prisma.unitInventory.findMany({
      where: { villageId: barbarian.id },
    });
    const initialTotal = initialUnits.reduce(
      (sum, unit) => sum + unit.quantity,
      0,
    );
    expect(initialTotal).toBeGreaterThanOrEqual(9);
    expect(initialTotal).toBeLessThanOrEqual(15);

    const oldTs = new Date(Date.now() - 250 * 60 * 60 * 1_000);
    await ctx.prisma.unitInventory.updateMany({
      where: { villageId: barbarian.id },
      data: { quantity: 0 },
    });
    await ctx.prisma.village.update({
      where: { id: barbarian.id },
      data: { barbarianTroopsLastRegenTs: oldTs },
    });
    await ctx.prisma.resourceStock.update({
      where: { villageId: barbarian.id },
      data: {
        wood: 0,
        stone: 0,
        iron: 0,
        lastUpdateTs: oldTs,
      },
    });

    const caughtUp = await ctx.prisma.$transaction((tx) =>
      runtime.catchUpVillage(tx, barbarian.id),
    );

    expect(caughtUp.units).toEqual({ MILITIA: 15 });
    expect(caughtUp.resources.wood).toBeGreaterThan(0);
    expect(caughtUp.resources.stone).toBeGreaterThan(0);
    expect(caughtUp.resources.iron).toBeGreaterThan(0);

    const persisted = await ctx.prisma.unitInventory.findUniqueOrThrow({
      where: {
        villageId_unitType: {
          villageId: barbarian.id,
          unitType: 'MILITIA',
        },
      },
    });
    expect(persisted.quantity).toBe(15);
  });

  it('jwt auth: register → access protected → refresh → access with new token', async () => {
    const {
      email,
      accessToken: t1,
      refreshToken,
    } = await registerUser(ctx.server);

    const r1 = await request(ctx.server)
      .get('/world/me/memberships')
      .set('Authorization', `Bearer ${t1}`);
    expect(r1.status).toBe(200);

    const refreshed = await request(ctx.server)
      .post('/auth/refresh')
      .send({ refreshToken });
    expect(refreshed.status).toBeLessThan(300);
    const t2 = (refreshed.body as { accessToken: string }).accessToken;
    expect(t2).toBeTruthy();

    const r2 = await request(ctx.server)
      .get('/world/me/memberships')
      .set('Authorization', `Bearer ${t2}`);
    expect(r2.status).toBe(200);

    const login = await request(ctx.server)
      .post('/auth/login')
      .send({ email, password: 'smoke-password-123' });
    expect(login.status).toBeLessThan(300);
    expect((login.body as { accessToken: string }).accessToken).toBeTruthy();
  });

  it('fog of war: GET /world/:id/entities masks barbarians outside vision disks', async () => {
    // Player has no WATCHTOWER → 0 vision disks → every world entity comes back as 'fogged'
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'fog-watcher',
    );
    const foggedX = join.village.x + 10;
    const foggedY = join.village.y + 10;

    await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        isBarbarian: true,
        name: 'fogged-barb',
        x: foggedX,
        y: foggedY,
        tier: 'T1',
      },
    });

    const res = await request(ctx.server)
      .get(`/world/${world.id}/entities`)
      .set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.status).toBe(200);

    const entities = res.body as Array<{
      id: string;
      kind: string;
      x: number;
      y: number;
    }>;
    const found = entities.find((e) => e.x === foggedX && e.y === foggedY);
    expect(found).toBeTruthy();
    expect(found?.kind).toBe('fogged');
  });

  it('outbox dispatch: real Socket.IO client receives building.completed', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'ws-village',
    );
    const villageId = join.village.id;

    await ctx.prisma.resourceStock.update({
      where: { villageId },
      data: {
        wood: 1_000_000,
        stone: 1_000_000,
        iron: 1_000_000,
        maxPerType: 10_000_000,
      },
    });

    const client: ClientSocket = ioClient(`http://localhost:${port}`, {
      auth: { token: user.accessToken },
      transports: ['websocket'],
      forceNew: true,
    });

    try {
      await new Promise<void>((resolve, reject) => {
        client.once('connect', () => resolve());
        client.once('connect_error', (err) => reject(err));
        setTimeout(() => reject(new Error('socket connect timeout')), 5_000);
      });

      const received = new Promise<unknown>((resolve, reject) => {
        client.once('building.completed', (data) => resolve(data));
        setTimeout(
          () => reject(new Error('building.completed not received within 15s')),
          15_000,
        );
      });

      await request(ctx.server)
        .post(`/village/${villageId}/upgrade`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ buildingType: 'WOOD' });

      const payload = await received;
      expect(payload).toBeTruthy();
    } finally {
      client.disconnect();
    }
  });

  it('reset world: join → upgrade → DELETE /world/:id/me wipes everything → re-join recreates fresh village', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join1 = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'reset-village',
    );
    const village1Id = join1.village.id;

    await ctx.prisma.resourceStock.update({
      where: { villageId: village1Id },
      data: {
        wood: 1_000_000,
        stone: 1_000_000,
        iron: 1_000_000,
        maxPerType: 10_000_000,
      },
    });
    const upgrade = await request(ctx.server)
      .post(`/village/${village1Id}/upgrade`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ buildingType: 'WOOD' });
    expect(upgrade.status).toBeLessThan(300);

    const attackerCombatReport = await ctx.prisma.combatReport.create({
      data: {
        worldId: world.id,
        attackerUserId: user.userId,
        attackerVillageId: village1Id,
        targetKind: 'BARBARIAN_VILLAGE',
        targetX: 0,
        targetY: 0,
        loot: {},
        lossesAttacker: {},
        details: {},
      },
    });
    const defenderCombatReport = await ctx.prisma.combatReport.create({
      data: {
        worldId: world.id,
        attackerUserId: 'other-user-noop',
        attackerVillageId: 'other-village-noop',
        defenderUserId: user.userId,
        defenderVillageId: village1Id,
        targetKind: 'PLAYER_VILLAGE',
        targetX: 0,
        targetY: 0,
        loot: {},
        lossesAttacker: {},
        details: {},
      },
    });

    const reset = await request(ctx.server)
      .delete(`/world/${world.id}/me`)
      .set('Authorization', `Bearer ${user.accessToken}`);
    expect(reset.status).toBeLessThan(300);

    const scope = { userId: user.userId, worldId: world.id };
    const counts = {
      villages: await ctx.prisma.village.count({ where: scope }),
      memberships: await ctx.prisma.worldMembership.count({ where: scope }),
      crowns: await ctx.prisma.crownBalance.count({ where: scope }),
      seedStates: await ctx.prisma.worldSeedState.count({ where: scope }),
      buildings: await ctx.prisma.building.count({
        where: { villageId: village1Id },
      }),
      resourceStock: await ctx.prisma.resourceStock.count({
        where: { villageId: village1Id },
      }),
      population: await ctx.prisma.population.count({
        where: { villageId: village1Id },
      }),
      expeditions: await ctx.prisma.expedition.count({
        where: { attackerVillageId: village1Id },
      }),
      attackerReports: await ctx.prisma.combatReport.count({
        where: { worldId: world.id, attackerUserId: user.userId },
      }),
    };
    expect(counts).toEqual({
      villages: 0,
      memberships: 0,
      crowns: 0,
      seedStates: 0,
      buildings: 0,
      resourceStock: 0,
      population: 0,
      expeditions: 0,
      attackerReports: 0,
    });
    expect(attackerCombatReport.id).toBeTruthy();

    const anonymized = await ctx.prisma.combatReport.findUnique({
      where: { id: defenderCombatReport.id },
    });
    expect(anonymized?.defenderUserId).toBeNull();
    expect(anonymized?.defenderVillageId).toBeNull();

    const [parallelA, parallelB] = await Promise.all([
      request(ctx.server)
        .delete(`/world/${world.id}/me`)
        .set('Authorization', `Bearer ${user.accessToken}`),
      request(ctx.server)
        .delete(`/world/${world.id}/me`)
        .set('Authorization', `Bearer ${user.accessToken}`),
    ]);
    expect(parallelA.status).toBeLessThan(300);
    expect(parallelB.status).toBeLessThan(300);

    const join2 = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'reset-village-2',
    );
    expect(join2.village.id).not.toBe(village1Id);
    const wood2 = await ctx.prisma.building.findFirst({
      where: { villageId: join2.village.id, type: 'WOOD' },
    });
    expect(wood2?.level).toBe(1);
  });
});
