import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  truncateAll,
  type SmokeContext,
} from './helpers';

describe('combat reports inbox smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await truncateAll(ctx.prisma);
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
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
});
