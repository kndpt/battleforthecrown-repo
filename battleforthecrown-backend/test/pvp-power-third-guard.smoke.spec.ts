import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  type SmokeContext,
} from './helpers';

/**
 * Anti-snowball power guard — spec `14-pvp-conquest.md` § 2.
 * A PvP attack (raid or conquest) is forbidden when the defender's kingdom
 * power is strictly below 1/3 of the attacker's. Barbarian villages are exempt.
 * Heroic asymmetry: a small attacker may always hit a large defender.
 *
 * The newbie shield (run 056) runs *before* this guard inside initiateAttack, so
 * every defender's shield is expired here to isolate the power-ratio behaviour.
 */
describe('pvp power-ratio (÷3) guard smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  // ─── helpers ───────────────────────────────────────────────────────────────

  /** Attacker with vision (WATCHTOWER lvl 1) and a calibrated MILITIA army. */
  async function setupAttacker(
    worldId: string,
    villageName: string,
    militia: number,
  ): Promise<{
    userId: string;
    accessToken: string;
    villageId: string;
    x: number;
    y: number;
  }> {
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      worldId,
      villageName,
    );
    const villageId = join.village.id;

    await ctx.prisma.unitInventory.create({
      data: { villageId, unitType: 'MILITIA', quantity: militia },
    });
    await ctx.prisma.building.updateMany({
      where: { villageId, type: 'WATCHTOWER' },
      data: { level: 1 },
    });

    return {
      userId: user.userId,
      accessToken: user.accessToken,
      villageId,
      x: join.village.x,
      y: join.village.y,
    };
  }

  /**
   * Defender player village adjacent to the attacker (within vision 5), with a
   * calibrated MILITIA army and an *expired* newbie shield so only the power
   * guard can block the attack.
   */
  async function setupDefender(
    worldId: string,
    attackerX: number,
    attackerY: number,
    villageName: string,
    militia: number,
  ): Promise<{ userId: string; villageId: string; x: number; y: number }> {
    const user = await registerUser(ctx.server);
    const village = await ctx.prisma.village.create({
      data: {
        worldId,
        userId: user.userId,
        isBarbarian: false,
        name: villageName,
        x: attackerX + 2,
        y: attackerY,
        resourceStock: {
          create: { wood: 500, stone: 500, iron: 500, maxPerType: 100_000 },
        },
      },
    });
    if (militia > 0) {
      await ctx.prisma.unitInventory.create({
        data: { villageId: village.id, unitType: 'MILITIA', quantity: militia },
      });
    }
    // Membership required for shield lookup; joinedAt antedated 49h → shield expired.
    await ctx.prisma.worldMembership.create({
      data: {
        userId: user.userId,
        worldId,
        joinedAt: new Date(Date.now() - 49 * 60 * 60 * 1000),
      },
    });

    return {
      userId: user.userId,
      villageId: village.id,
      x: village.x,
      y: village.y,
    };
  }

  /** Reads a player's total kingdom power via the public endpoint. */
  async function kingdomPower(
    userId: string,
    worldId: string,
  ): Promise<number> {
    const res = await request(ctx.server)
      .get(`/power/kingdom/${userId}/public`)
      .query({ worldId });
    expect(res.status).toBeLessThan(300);
    return (res.body as { kingdomPower: number }).kingdomPower;
  }

  // ─── case 1: below threshold → blocked ───────────────────────────────────────

  it('case 1: PvP attack below 1/3 → 403 POWER_RATIO_FORBIDDEN + no expedition + units unchanged', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const attacker = await setupAttacker(world.id, 'pr-attacker-1', 1000); // army 2000
    const defender = await setupDefender(
      world.id,
      attacker.x,
      attacker.y,
      'pr-defender-1',
      10,
    ); // army 20

    // Precondition: attacker power strictly above 3× defender power.
    const aPow = await kingdomPower(attacker.userId, world.id);
    const dPow = await kingdomPower(defender.userId, world.id);
    expect(dPow * 3).toBeLessThan(aPow);

    const inventoryBefore = await ctx.prisma.unitInventory.findFirstOrThrow({
      where: { villageId: attacker.villageId, unitType: 'MILITIA' },
    });
    const tsBefore = new Date();

    const res = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({
        villageId: attacker.villageId,
        targetX: defender.x,
        targetY: defender.y,
        targetKind: 'PLAYER_VILLAGE',
        targetRefId: defender.villageId,
        units: { MILITIA: 10 },
      });

    expect(res.status).toBe(403);
    expect((res.body as { message?: unknown }).message).toBe(
      'POWER_RATIO_FORBIDDEN',
    );

    const expeditionCount = await ctx.prisma.expedition.count({
      where: {
        attackerVillageId: attacker.villageId,
        createdAt: { gte: tsBefore },
      },
    });
    expect(expeditionCount).toBe(0);

    const inventoryAfter = await ctx.prisma.unitInventory.findFirstOrThrow({
      where: { villageId: attacker.villageId, unitType: 'MILITIA' },
    });
    expect(inventoryAfter.quantity).toBe(inventoryBefore.quantity);
  });

  // ─── case 2: at/above threshold → allowed ────────────────────────────────────

  it('case 2: PvP attack with defender ≥ attacker/3 → 200 + expedition created + units deducted', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const attacker = await setupAttacker(world.id, 'pr-attacker-2', 30);

    // Calibrate defender army so defenderPower ≥ ceil(attackerPower / 3) (MILITIA = 2 power).
    const aPow = await kingdomPower(attacker.userId, world.id);
    const militiaForThreshold = Math.ceil(Math.ceil(aPow / 3) / 2);
    const defender = await setupDefender(
      world.id,
      attacker.x,
      attacker.y,
      'pr-defender-2',
      militiaForThreshold,
    );

    // Precondition: defender power × 3 ≥ attacker power (threshold satisfied).
    const dPow = await kingdomPower(defender.userId, world.id);
    expect(dPow * 3).toBeGreaterThanOrEqual(aPow);

    const res = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({
        villageId: attacker.villageId,
        targetX: defender.x,
        targetY: defender.y,
        targetKind: 'PLAYER_VILLAGE',
        targetRefId: defender.villageId,
        units: { MILITIA: 10 },
      });

    expect(res.status).toBeLessThan(300);

    const expedition = await ctx.prisma.expedition.findFirst({
      where: {
        attackerVillageId: attacker.villageId,
        targetRefId: defender.villageId,
      },
    });
    expect(expedition).not.toBeNull();

    const inventoryAfter = await ctx.prisma.unitInventory.findFirstOrThrow({
      where: { villageId: attacker.villageId, unitType: 'MILITIA' },
    });
    expect(inventoryAfter.quantity).toBe(20); // 30 − 10 sent
  });

  // ─── case 3: barbarian target → always allowed ───────────────────────────────

  it('case 3: barbarian attack ignores power ratio → 200 even with huge attacker', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const attacker = await setupAttacker(world.id, 'pr-attacker-3', 1000); // army 2000

    const barbarian = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        isBarbarian: true,
        name: 'pr-barb-target-3',
        x: attacker.x + 1,
        y: attacker.y,
        tier: 'T1',
        resourceStock: {
          create: { wood: 200, stone: 200, iron: 100, maxPerType: 100_000 },
        },
      },
    });

    const res = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({
        villageId: attacker.villageId,
        targetX: barbarian.x,
        targetY: barbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: barbarian.id,
        units: { MILITIA: 5 },
      });

    expect(res.status).toBeLessThan(300);
    const expedition = await ctx.prisma.expedition.findFirst({
      where: {
        attackerVillageId: attacker.villageId,
        targetRefId: barbarian.id,
      },
    });
    expect(expedition).not.toBeNull();
  });

  // ─── case 4: heroic asymmetry (small attacker, large defender) → allowed ──────

  it('case 4: small attacker vs large defender → 200 (heroic asymmetry preserved)', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const attacker = await setupAttacker(world.id, 'pr-attacker-4', 10); // tiny army
    const defender = await setupDefender(
      world.id,
      attacker.x,
      attacker.y,
      'pr-defender-4',
      5000,
    ); // huge army

    const aPow = await kingdomPower(attacker.userId, world.id);
    const dPow = await kingdomPower(defender.userId, world.id);
    expect(dPow).toBeGreaterThan(aPow); // defender clearly stronger

    const res = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({
        villageId: attacker.villageId,
        targetX: defender.x,
        targetY: defender.y,
        targetKind: 'PLAYER_VILLAGE',
        targetRefId: defender.villageId,
        units: { MILITIA: 5 },
      });

    expect(res.status).toBeLessThan(300);
    const expedition = await ctx.prisma.expedition.findFirst({
      where: {
        attackerVillageId: attacker.villageId,
        targetRefId: defender.villageId,
      },
    });
    expect(expedition).not.toBeNull();
  });
});
