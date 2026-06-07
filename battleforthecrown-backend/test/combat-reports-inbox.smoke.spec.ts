import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  type SmokeContext,
} from './helpers';

describe('combat reports inbox smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('combat reports: list, read, and delete are scoped to the current participant', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const attacker = await registerUser(ctx.server);
    const defender = await registerUser(ctx.server);
    const observer = await registerUser(ctx.server);
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
    await joinWorld(
      ctx.server,
      observer.accessToken,
      world.id,
      'report-observer',
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
        attackerVillageName: attackerJoin.village.name,
        attackerX: attackerJoin.village.x,
        attackerY: attackerJoin.village.y,
        defenderUserId: defender.userId,
        defenderVillageId: defenderJoin.village.id,
        defenderVillageName: defenderJoin.village.name,
        defenderX: defenderJoin.village.x,
        defenderY: defenderJoin.village.y,
        observerUserId: observer.userId,
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

    const selfOccupation = await ctx.prisma.combatReport.create({
      data: {
        worldId: world.id,
        attackerUserId: attacker.userId,
        attackerVillageId: attackerJoin.village.id,
        defenderUserId: attacker.userId,
        defenderVillageId: defenderJoin.village.id,
        targetKind: 'BARBARIAN_VILLAGE',
        targetX: defenderJoin.village.x,
        targetY: defenderJoin.village.y,
        loot: {},
        lossesAttacker: {},
        lossesDefender: {},
        details: {
          occupationDefense: { attackerVillageId: attackerJoin.village.id },
        },
        timestamp: new Date('2026-05-11T22:00:00.000Z'),
      },
    });

    const hideSelfOccupation = await request(ctx.server)
      .delete(`/combat/report/${selfOccupation.id}`)
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .set('x-world-id', world.id);
    expect(hideSelfOccupation.status).toBeLessThan(300);
    await expect(
      ctx.prisma.combatReport.findUniqueOrThrow({
        where: { id: selfOccupation.id },
      }),
    ).rejects.toThrow();

    const list = await request(ctx.server)
      .get('/combat/reports')
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .set('x-world-id', world.id);
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
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .set('x-world-id', world.id);
    expect(attackerRead.status).toBeLessThan(300);
    const attackerReadBody = attackerRead.body as unknown as {
      isRead: boolean;
    };
    expect(attackerReadBody.isRead).toBe(true);

    const defenderDetail = await request(ctx.server)
      .get(`/combat/report/${shared.id}`)
      .set('Authorization', `Bearer ${defender.accessToken}`)
      .set('x-world-id', world.id);
    expect(defenderDetail.status).toBeLessThan(300);
    const defenderDetailBody = defenderDetail.body as unknown as {
      attackerVillageName: string;
      attackerX: number;
      attackerY: number;
      defenderVillageName: string;
      defenderX: number;
      defenderY: number;
      isRead: boolean;
      recipientRole: string;
    };
    expect(defenderDetailBody.isRead).toBe(false);
    expect(defenderDetailBody.recipientRole).toBe('defender');
    expect(defenderDetailBody).toEqual(
      expect.objectContaining({
        attackerVillageName: attackerJoin.village.name,
        attackerX: attackerJoin.village.x,
        attackerY: attackerJoin.village.y,
        defenderVillageName: defenderJoin.village.name,
        defenderX: defenderJoin.village.x,
        defenderY: defenderJoin.village.y,
      }),
    );

    const observerRead = await request(ctx.server)
      .patch(`/combat/report/${shared.id}/read`)
      .set('Authorization', `Bearer ${observer.accessToken}`)
      .set('x-world-id', world.id);
    expect(observerRead.status).toBeLessThan(300);
    const observerReadBody = observerRead.body as unknown as {
      isRead: boolean;
      recipientRole: string;
    };
    expect(observerReadBody).toEqual(
      expect.objectContaining({ isRead: true, recipientRole: 'observer' }),
    );

    const defenderStillUnread = await request(ctx.server)
      .get(`/combat/report/${shared.id}`)
      .set('Authorization', `Bearer ${defender.accessToken}`)
      .set('x-world-id', world.id);
    expect((defenderStillUnread.body as { isRead: boolean }).isRead).toBe(
      false,
    );

    const hideForAttacker = await request(ctx.server)
      .delete(`/combat/report/${shared.id}`)
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .set('x-world-id', world.id);
    expect(hideForAttacker.status).toBeLessThan(300);

    const attackerListAfterDelete = await request(ctx.server)
      .get('/combat/reports')
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .set('x-world-id', world.id);
    const attackerReportsAfterDelete =
      attackerListAfterDelete.body as unknown as Array<{ id: string }>;
    expect(
      attackerReportsAfterDelete.some((report) => report.id === shared.id),
    ).toBe(false);

    const defenderStillSeesIt = await request(ctx.server)
      .get(`/combat/report/${shared.id}`)
      .set('Authorization', `Bearer ${defender.accessToken}`)
      .set('x-world-id', world.id);
    expect(defenderStillSeesIt.status).toBeLessThan(300);

    const hideForDefender = await request(ctx.server)
      .delete(`/combat/report/${shared.id}`)
      .set('Authorization', `Bearer ${defender.accessToken}`)
      .set('x-world-id', world.id);
    expect(hideForDefender.status).toBeLessThan(300);

    const observerStillSeesIt = await request(ctx.server)
      .get(`/combat/report/${shared.id}`)
      .set('Authorization', `Bearer ${observer.accessToken}`)
      .set('x-world-id', world.id);
    expect(observerStillSeesIt.status).toBeLessThan(300);

    const hideForObserver = await request(ctx.server)
      .delete(`/combat/report/${shared.id}`)
      .set('Authorization', `Bearer ${observer.accessToken}`)
      .set('x-world-id', world.id);
    expect(hideForObserver.status).toBeLessThan(300);
    await expect(
      ctx.prisma.combatReport.findUniqueOrThrow({ where: { id: shared.id } }),
    ).rejects.toThrow();
  });

  it('world-scoped player data: power and reports stay isolated between worlds', async () => {
    const worldA = await seedSmokeWorld(ctx.prisma);
    const worldB = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const joinA = await joinWorld(
      ctx.server,
      user.accessToken,
      worldA.id,
      'world-a-capital',
    );
    const joinB = await joinWorld(
      ctx.server,
      user.accessToken,
      worldB.id,
      'world-b-capital',
    );

    const extraVillageA = await ctx.prisma.village.create({
      data: {
        worldId: worldA.id,
        userId: user.userId,
        name: 'world-a-extra',
        x: 499,
        y: 499,
        buildings: { create: { type: 'CASTLE', level: 3 } },
      },
    });

    const powerA = await request(ctx.server)
      .get('/power/kingdom')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .set('x-world-id', worldA.id);
    expect(powerA.status).toBe(200);
    expect(
      (powerA.body as { villages: Array<{ villageId: string }> }).villages.map(
        (village) => village.villageId,
      ),
    ).toEqual(expect.arrayContaining([joinA.village.id, extraVillageA.id]));
    expect(
      (powerA.body as { villages: Array<{ villageId: string }> }).villages.map(
        (village) => village.villageId,
      ),
    ).not.toContain(joinB.village.id);

    const powerB = await request(ctx.server)
      .get('/power/kingdom')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .set('x-world-id', worldB.id);
    expect(powerB.status).toBe(200);
    expect(
      (powerB.body as { villages: Array<{ villageId: string }> }).villages.map(
        (village) => village.villageId,
      ),
    ).toEqual([joinB.village.id]);

    const publicKingdomA = await request(ctx.server)
      .get(`/power/kingdom/${user.userId}/public`)
      .query({ worldId: worldA.id });
    expect(publicKingdomA.status).toBe(200);
    expect((publicKingdomA.body as { kingdomPower: number }).kingdomPower).toBe(
      (powerA.body as { kingdomPower: number }).kingdomPower,
    );

    const publicKingdomMissingWorld = await request(ctx.server).get(
      `/power/kingdom/${user.userId}/public`,
    );
    expect(publicKingdomMissingWorld.status).toBe(400);

    const leaderboardA = await request(ctx.server)
      .get('/power/leaderboard')
      .query({ worldId: worldA.id });
    expect(leaderboardA.status).toBe(200);
    expect(
      (leaderboardA.body as Array<{ villageId: string }>).map(
        (entry) => entry.villageId,
      ),
    ).toEqual(expect.arrayContaining([joinA.village.id, extraVillageA.id]));
    expect(
      (leaderboardA.body as Array<{ villageId: string }>).map(
        (entry) => entry.villageId,
      ),
    ).not.toContain(joinB.village.id);

    const leaderboardMissingWorld = await request(ctx.server).get(
      '/power/leaderboard',
    );
    expect(leaderboardMissingWorld.status).toBe(400);

    const reportA = await ctx.prisma.combatReport.create({
      data: {
        worldId: worldA.id,
        attackerUserId: user.userId,
        attackerVillageId: joinA.village.id,
        targetKind: 'BARBARIAN_VILLAGE',
        targetX: 1,
        targetY: 1,
        loot: {},
        lossesAttacker: {},
        details: {},
        timestamp: new Date('2026-05-11T22:00:00.000Z'),
      },
    });
    const reportB = await ctx.prisma.combatReport.create({
      data: {
        worldId: worldB.id,
        attackerUserId: user.userId,
        attackerVillageId: joinB.village.id,
        targetKind: 'BARBARIAN_VILLAGE',
        targetX: 2,
        targetY: 2,
        loot: {},
        lossesAttacker: {},
        details: {},
        timestamp: new Date('2026-05-11T23:00:00.000Z'),
      },
    });

    const reportsA = await request(ctx.server)
      .get('/combat/reports')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .set('x-world-id', worldA.id);
    expect(reportsA.status).toBe(200);
    expect((reportsA.body as Array<{ id: string }>).map((r) => r.id)).toEqual([
      reportA.id,
    ]);

    const reportACrossWorld = await request(ctx.server)
      .get(`/combat/report/${reportA.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .set('x-world-id', worldB.id);
    expect(reportACrossWorld.status).toBe(404);

    const reportBRead = await request(ctx.server)
      .patch(`/combat/report/${reportB.id}/read`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .set('x-world-id', worldA.id);
    expect(reportBRead.status).toBe(404);

    const reportBDelete = await request(ctx.server)
      .delete(`/combat/report/${reportB.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .set('x-world-id', worldA.id);
    expect(reportBDelete.status).toBe(404);

    const scoutA = await ctx.prisma.scoutReport.create({
      data: {
        worldId: worldA.id,
        scoutUserId: user.userId,
        scoutVillageId: joinA.village.id,
        targetKind: 'BARBARIAN_VILLAGE',
        targetX: 3,
        targetY: 3,
        units: {},
        resources: {},
        details: {},
      },
    });
    const scoutB = await ctx.prisma.scoutReport.create({
      data: {
        worldId: worldB.id,
        scoutUserId: user.userId,
        scoutVillageId: joinB.village.id,
        targetKind: 'BARBARIAN_VILLAGE',
        targetX: 4,
        targetY: 4,
        units: {},
        resources: {},
        details: {},
      },
    });

    const scoutsA = await request(ctx.server)
      .get('/combat/scout-reports')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .set('x-world-id', worldA.id);
    expect(scoutsA.status).toBe(200);
    expect((scoutsA.body as Array<{ id: string }>).map((r) => r.id)).toEqual([
      scoutA.id,
    ]);

    const scoutACrossWorld = await request(ctx.server)
      .get(`/combat/scout-report/${scoutA.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .set('x-world-id', worldB.id);
    expect(scoutACrossWorld.status).toBe(404);

    const scoutADeleteCrossWorld = await request(ctx.server)
      .delete(`/combat/scout-report/${scoutA.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .set('x-world-id', worldB.id);
    expect(scoutADeleteCrossWorld.status).toBe(404);

    const scoutBRead = await request(ctx.server)
      .patch(`/combat/scout-report/${scoutB.id}/read`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .set('x-world-id', worldA.id);
    expect(scoutBRead.status).toBe(404);
  });
});
