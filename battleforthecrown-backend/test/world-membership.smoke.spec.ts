import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  type SmokeContext,
} from './helpers';

describe('world membership smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
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
      onboardingStates: await ctx.prisma.onboardingState.count({
        where: scope,
      }),
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
      onboardingStates: 0,
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
    await expect(
      ctx.prisma.onboardingState.count({ where: scope }),
    ).resolves.toBe(1);
    await expect(
      ctx.prisma.resourceStock.findUniqueOrThrow({
        where: { villageId: join2.village.id },
      }),
    ).resolves.toMatchObject({ wood: 1850, stone: 1850, iron: 1850 });
    await expect(
      ctx.prisma.crownBalance.findUniqueOrThrow({
        where: { userId_worldId: scope },
      }),
    ).resolves.toMatchObject({ balance: 100 });
  });
});
