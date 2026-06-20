import request from 'supertest';
import {
  bootSmokeApp,
  expireNewbieShield,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  waitFor,
  type SmokeContext,
} from './helpers';
import { SMOKE_WORLD_CONFIG } from './fixtures/smoke-world-config';

describe('village strategy smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  async function seedPlayer(
    tag: string,
    worldId: string,
    x: number,
    y: number,
  ) {
    const user = await registerUser(ctx.server, tag);
    const joined = await joinWorld(ctx.server, user.accessToken, worldId, tag);
    await ctx.prisma.village.update({
      where: { id: joined.village.id },
      data: { x, y },
    });
    return { user, village: { ...joined.village, x, y } };
  }

  async function stockVillage(
    villageId: string,
    resources = { wood: 1_000, stone: 1_000, iron: 1_000 },
  ) {
    await ctx.prisma.resourceStock.update({
      where: { villageId },
      data: { ...resources, maxPerType: 10_000 },
    });
  }

  async function setUnits(villageId: string, quantity: number) {
    await ctx.prisma.unitInventory.create({
      data: { villageId, unitType: 'MILITIA', quantity },
    });
    await ctx.prisma.population.update({
      where: { villageId },
      data: { used: quantity, max: 1_000 },
    });
  }

  async function attackPlayer(params: {
    token: string;
    attackerVillageId: string;
    defenderVillageId: string;
    targetX: number;
    targetY: number;
    units: number;
  }) {
    const res = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${params.token}`)
      .send({
        villageId: params.attackerVillageId,
        targetX: params.targetX,
        targetY: params.targetY,
        targetKind: 'PLAYER_VILLAGE',
        targetRefId: params.defenderVillageId,
        units: { MILITIA: params.units },
      });
    expect(res.status).toBeLessThan(300);

    return waitFor(
      () =>
        ctx.prisma.combatReport.findFirst({
          where: { attackerVillageId: params.attackerVillageId },
        }),
      { timeoutMs: 15_000 },
    );
  }

  it('exposes private strategy state, charges first change, enforces cooldown, and keeps map payloads private', async () => {
    const world = await seedSmokeWorld(ctx.prisma, `style-api-${Date.now()}`);
    const { user, village } = await seedPlayer('style-owner', world.id, 10, 10);

    const initialInfo = await request(ctx.server)
      .get('/village/strategy')
      .query({ villageId: village.id })
      .set('Authorization', `Bearer ${user.accessToken}`);
    expect(initialInfo.status).toBe(200);
    expect(initialInfo.body).toMatchObject({
      currentStrategy: 'BALANCED',
      canChange: true,
      hasCouncilHall: false,
      changeCosts: {
        FORTRESS: { wood: 200, stone: 100, iron: 50, crowns: 80 },
        RAIDERS: { wood: 50, stone: 100, iron: 200, crowns: 80 },
        ECONOMIC: { wood: 100, stone: 200, iron: 50, crowns: 60 },
        BALANCED: { wood: 100, stone: 100, iron: 100, crowns: 80 },
      },
    });

    const blocked = await request(ctx.server)
      .post(`/village/${village.id}/strategy`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ strategy: 'RAIDERS' });
    expect(blocked.status).toBe(400);

    await ctx.prisma.building.updateMany({
      where: { villageId: village.id, type: 'CASTLE' },
      data: { level: 4 },
    });
    await ctx.prisma.building.updateMany({
      where: { villageId: village.id, type: 'COUNCIL_HALL' },
      data: { level: 1 },
    });
    await stockVillage(village.id);
    await ctx.prisma.crownBalance.update({
      where: { userId_worldId: { userId: user.userId, worldId: world.id } },
      data: { balance: 500 },
    });

    const changed = await request(ctx.server)
      .post(`/village/${village.id}/strategy`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ strategy: 'RAIDERS' });
    expect(changed.status).toBe(201);
    expect(changed.body).toMatchObject({
      success: true,
      newStrategy: 'RAIDERS',
      cost: { wood: 50, stone: 100, iron: 200, crowns: 80 },
    });

    await expect(
      ctx.prisma.resourceStock.findUniqueOrThrow({
        where: { villageId: village.id },
      }),
    ).resolves.toMatchObject({ wood: 950, stone: 900, iron: 800 });
    await expect(
      ctx.prisma.crownBalance.findUniqueOrThrow({
        where: { userId_worldId: { userId: user.userId, worldId: world.id } },
      }),
    ).resolves.toMatchObject({ balance: 420 });

    const cooldownBlocked = await request(ctx.server)
      .post(`/village/${village.id}/strategy`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ strategy: 'FORTRESS' });
    expect(cooldownBlocked.status).toBe(409);

    await ctx.prisma.villageStrategyConfig.update({
      where: { villageId: village.id },
      data: { cooldownEndsAt: new Date(Date.now() - 1_000) },
    });

    const changedAfterCooldown = await request(ctx.server)
      .post(`/village/${village.id}/strategy`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ strategy: 'FORTRESS' });
    expect(changedAfterCooldown.status).toBe(201);

    const reloaded = await request(ctx.server)
      .get('/village/strategy')
      .query({ villageId: village.id })
      .set('Authorization', `Bearer ${user.accessToken}`);
    expect(reloaded.body).toMatchObject({ currentStrategy: 'FORTRESS' });

    const publicVillages = await request(ctx.server)
      .get(`/world/${world.id}/villages`)
      .set('Authorization', `Bearer ${user.accessToken}`);
    expect(publicVillages.status).toBe(200);
    expect(JSON.stringify(publicVillages.body)).not.toContain('FORTRESS');
    expect(JSON.stringify(publicVillages.body)).not.toContain('strategyConfig');
  }, 30_000);

  it('serializes concurrent strategy changes — single debit, no double-charge (TOCTOU)', async () => {
    const world = await seedSmokeWorld(ctx.prisma, `style-race-${Date.now()}`);
    const { user, village } = await seedPlayer('race-owner', world.id, 40, 40);

    await ctx.prisma.building.updateMany({
      where: { villageId: village.id, type: 'CASTLE' },
      data: { level: 4 },
    });
    await ctx.prisma.building.updateMany({
      where: { villageId: village.id, type: 'COUNCIL_HALL' },
      data: { level: 1 },
    });
    // Stock + balance sized for TWO changes, so only the cooldown guard (not
    // insufficiency) can reject the loser. Both target *different* strategies so
    // the loser always hits the cooldown (409), never "already uses" (400).
    await stockVillage(village.id, { wood: 1_000, stone: 1_000, iron: 1_000 });
    await ctx.prisma.crownBalance.update({
      where: { userId_worldId: { userId: user.userId, worldId: world.id } },
      data: { balance: 500 },
    });

    const fire = (strategy: 'RAIDERS' | 'FORTRESS') =>
      request(ctx.server)
        .post(`/village/${village.id}/strategy`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ strategy });

    const [a, b] = await Promise.all([fire('RAIDERS'), fire('FORTRESS')]);

    // Exactly one wins; the loser is serialized out by the atomic cooldown
    // guard (or the first-change unique-constraint race), both surfaced as 409.
    expect([a.status, b.status].sort()).toEqual([201, 409]);

    // Crowns debited exactly once (both strategies cost 80). On the old code the
    // cooldown TOCTOU let both transactions through, leaving balance at 340.
    await expect(
      ctx.prisma.crownBalance.findUniqueOrThrow({
        where: { userId_worldId: { userId: user.userId, worldId: world.id } },
      }),
    ).resolves.toMatchObject({ balance: 420 });

    // Resources debited by exactly one change. RAIDERS and FORTRESS both total
    // 350 (50+100+200 / 200+100+50), so the sum is winner-independent.
    const stock = await ctx.prisma.resourceStock.findUniqueOrThrow({
      where: { villageId: village.id },
    });
    expect(stock.wood + stock.stone + stock.iron).toBe(3_000 - 350);
  }, 30_000);

  it('applies fortress defense bonus in real combat resolution', async () => {
    const world = await ctx.prisma.world.create({
      data: {
        id: `style-combat-${Date.now()}`,
        name: 'Village Strategy Combat',
        status: 'OPEN',
        config: {
          ...SMOKE_WORLD_CONFIG,
          fogOfWar: { enabled: false },
        },
      },
    });
    const balancedAttacker = await seedPlayer(
      'balanced-attacker',
      world.id,
      20,
      20,
    );
    const fortressAttacker = await seedPlayer(
      'fortress-attacker',
      world.id,
      30,
      30,
    );
    const balancedDefender = await seedPlayer(
      'balanced-defender',
      world.id,
      21,
      20,
    );
    const fortressDefender = await seedPlayer(
      'fortress-defender',
      world.id,
      31,
      30,
    );

    await setUnits(balancedAttacker.village.id, 100);
    await setUnits(fortressAttacker.village.id, 100);
    await setUnits(balancedDefender.village.id, 100);
    await setUnits(fortressDefender.village.id, 100);
    await stockVillage(balancedDefender.village.id, {
      wood: 0,
      stone: 0,
      iron: 0,
    });
    await stockVillage(fortressDefender.village.id, {
      wood: 0,
      stone: 0,
      iron: 0,
    });
    await ctx.prisma.villageStrategyConfig.create({
      data: { villageId: fortressDefender.village.id, strategy: 'FORTRESS' },
    });
    await expireNewbieShield(ctx.prisma, world.id);

    const balancedReport = await attackPlayer({
      token: balancedAttacker.user.accessToken,
      attackerVillageId: balancedAttacker.village.id,
      defenderVillageId: balancedDefender.village.id,
      targetX: balancedDefender.village.x,
      targetY: balancedDefender.village.y,
      units: 100,
    });
    const fortressReport = await attackPlayer({
      token: fortressAttacker.user.accessToken,
      attackerVillageId: fortressAttacker.village.id,
      defenderVillageId: fortressDefender.village.id,
      targetX: fortressDefender.village.x,
      targetY: fortressDefender.village.y,
      units: 100,
    });

    expect((balancedReport.lossesDefender as { MILITIA: number }).MILITIA).toBe(
      100,
    );
    expect(
      (fortressReport.lossesDefender as { MILITIA: number }).MILITIA,
    ).toBeLessThan(100);
  }, 30_000);
});
