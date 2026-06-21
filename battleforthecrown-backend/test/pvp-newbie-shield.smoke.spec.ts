import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  type SmokeContext,
} from './helpers';

/**
 * Antidates joinedAt of a WorldMembership beyond newbieShieldHours so the
 * player is no longer under shield (shieldBrokenAt stays NULL — natural expiry).
 */
async function expireShieldByJoinDate(
  ctx: SmokeContext,
  userId: string,
  worldId: string,
): Promise<void> {
  // 49 h ago > 48 h shield → expired
  const joinedAt = new Date(Date.now() - 49 * 60 * 60 * 1000);
  await ctx.prisma.worldMembership.update({
    where: { userId_worldId: { userId, worldId } },
    data: { joinedAt },
  });
}

describe('pvp newbie-shield smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  // ─── helpers ───────────────────────────────────────────────────────────────

  /** Creates an attacker with MILITIA + WATCHTOWER level 1 (vision radius 5). */
  async function setupAttacker(
    worldId: string,
    villageName: string,
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
      data: { villageId, unitType: 'MILITIA', quantity: 50 },
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

  /** Creates a defender player village adjacent to attacker (within vision 5). */
  async function setupDefenderVillage(
    worldId: string,
    attackerX: number,
    attackerY: number,
    villageName: string,
  ): Promise<{
    userId: string;
    accessToken: string;
    villageId: string;
    x: number;
    y: number;
  }> {
    const user = await registerUser(ctx.server);
    // Create village directly in DB so we control the position (adjacent to attacker).
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
    // Give the defender real kingdom power so the ÷3 power guard (run 058) never
    // pre-empts the newbie-shield behaviour these cases isolate.
    await ctx.prisma.unitInventory.create({
      data: { villageId: village.id, unitType: 'MILITIA', quantity: 1000 },
    });
    // Membership is required so shield check finds it.
    await ctx.prisma.worldMembership.create({
      data: {
        userId: user.userId,
        worldId,
        joinedAt: new Date(),
      },
    });

    return {
      userId: user.userId,
      accessToken: user.accessToken,
      villageId: village.id,
      x: village.x,
      y: village.y,
    };
  }

  // ─── case 1 ─────────────────────────────────────────────────────────────────

  it('case 1: PvP attack blocked by newbie shield → 403 + no expedition + units unchanged', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const attacker = await setupAttacker(world.id, 'shield-attacker-1');
    const defender = await setupDefenderVillage(
      world.id,
      attacker.x,
      attacker.y,
      'shield-defender-1',
    );

    // Snapshot unit count before the blocked attack.
    const inventoryBefore = await ctx.prisma.unitInventory.findFirstOrThrow({
      where: { villageId: attacker.villageId, unitType: 'MILITIA' },
    });

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

    // Assert: 403 with the shield error code.
    expect(res.status).toBe(403);
    const body = res.body as { message?: unknown };
    expect(body.message).toBe('NEWBIE_SHIELD_ACTIVE');

    // Assert: no expedition created.
    const expeditionCount = await ctx.prisma.expedition.count({
      where: { attackerVillageId: attacker.villageId },
    });
    expect(expeditionCount).toBe(0);

    // Assert: attacker units not decremented.
    const inventoryAfter = await ctx.prisma.unitInventory.findFirstOrThrow({
      where: { villageId: attacker.villageId, unitType: 'MILITIA' },
    });
    expect(inventoryAfter.quantity).toBe(inventoryBefore.quantity);
  });

  // ─── case 2 ─────────────────────────────────────────────────────────────────

  it('case 2: barbarian attack while under shield → 200 + shieldBrokenAt stays NULL', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const attacker = await setupAttacker(world.id, 'shield-attacker-2');

    const barbarian = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        isBarbarian: true,
        name: 'shield-barb-target-2',
        x: attacker.x + 1,
        y: attacker.y,
        tier: 'T1',
        resourceStock: {
          create: { wood: 200, stone: 200, iron: 100, maxPerType: 100_000 },
        },
      },
    });
    await ctx.prisma.unitInventory.create({
      data: { villageId: barbarian.id, unitType: 'MILITIA', quantity: 1 },
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

    // Assert: attacker's shield was NOT broken (barb attack does not break it).
    const membership = await ctx.prisma.worldMembership.findUniqueOrThrow({
      where: {
        userId_worldId: { userId: attacker.userId, worldId: world.id },
      },
    });
    expect(membership.shieldBrokenAt).toBeNull();
  });

  // ─── case 3 ─────────────────────────────────────────────────────────────────

  it('case 3: scout PvP against protected defender → 200 + defender shieldBrokenAt stays NULL', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const attacker = await setupAttacker(world.id, 'shield-attacker-3');
    const defender = await setupDefenderVillage(
      world.id,
      attacker.x,
      attacker.y,
      'shield-defender-3',
    );

    // Add SPY unit (requires barracks lvl ≥ 3).
    await ctx.prisma.building.updateMany({
      where: { villageId: attacker.villageId, type: 'BARRACKS' },
      data: { level: 3 },
    });
    await ctx.prisma.unitInventory.create({
      data: { villageId: attacker.villageId, unitType: 'SPY', quantity: 2 },
    });

    const res = await request(ctx.server)
      .post('/combat/scout')
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({
        villageId: attacker.villageId,
        targetX: defender.x,
        targetY: defender.y,
        targetKind: 'PLAYER_VILLAGE',
        targetRefId: defender.villageId,
        units: { SPY: 1 },
      });
    expect(res.status).toBeLessThan(300);

    // Assert: defender shield intact after scout.
    const membership = await ctx.prisma.worldMembership.findUniqueOrThrow({
      where: {
        userId_worldId: { userId: defender.userId, worldId: world.id },
      },
    });
    expect(membership.shieldBrokenAt).toBeNull();
  });

  // ─── case 4 ─────────────────────────────────────────────────────────────────

  it('case 4: PvP outgoing attack while under shield → 200 + attacker shieldBrokenAt set', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const attacker = await setupAttacker(world.id, 'shield-attacker-4');
    const defender = await setupDefenderVillage(
      world.id,
      attacker.x,
      attacker.y,
      'shield-defender-4',
    );

    // Defender is NOT protected: antidate joinedAt beyond shield window.
    await expireShieldByJoinDate(ctx, defender.userId, world.id);

    const timeBefore = new Date();

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

    // Assert: attacker's shieldBrokenAt is now set (non-null).
    const membership = await ctx.prisma.worldMembership.findUniqueOrThrow({
      where: {
        userId_worldId: { userId: attacker.userId, worldId: world.id },
      },
    });
    expect(membership.shieldBrokenAt).not.toBeNull();
    expect(membership.shieldBrokenAt!.getTime()).toBeGreaterThanOrEqual(
      timeBefore.getTime(),
    );

    // Bonus: EventOutbox row pvp.shield.broken exists for this attacker.
    const outboxRow = await ctx.prisma.eventOutbox.findFirst({
      where: { kind: 'pvp.shield.broken', aggregateId: attacker.userId },
    });
    expect(outboxRow).not.toBeNull();
  });

  // ─── case 5 (bonus) ─────────────────────────────────────────────────────────

  it('case 5 (bonus): after attacker shield broken, incoming PvP attack against attacker is allowed', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    // "Former attacker" — now the target. We'll call them targetPlayer.
    const targetPlayer = await setupAttacker(
      world.id,
      'shield-former-attacker',
    );
    // "New attacker" — also needs MILITIA + vision.
    const newAttacker = await setupAttacker(world.id, 'shield-new-attacker');

    // Expire targetPlayer's shield naturally (joinedAt old) so the break below works.
    // Actually we want shieldBrokenAt set to simulate "already attacked PvP outgoing".
    await ctx.prisma.worldMembership.update({
      where: {
        userId_worldId: {
          userId: targetPlayer.userId,
          worldId: world.id,
        },
      },
      data: { shieldBrokenAt: new Date() },
    });

    // Make targetPlayer village visible to newAttacker (adjacent).
    await ctx.prisma.village.update({
      where: { id: targetPlayer.villageId },
      data: { x: newAttacker.x + 2, y: newAttacker.y },
    });

    const res = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${newAttacker.accessToken}`)
      .send({
        villageId: newAttacker.villageId,
        targetX: newAttacker.x + 2,
        targetY: newAttacker.y,
        targetKind: 'PLAYER_VILLAGE',
        targetRefId: targetPlayer.villageId,
        units: { MILITIA: 5 },
      });

    // Assert: attack succeeds — shield no longer blocks.
    expect(res.status).toBeLessThan(300);

    const expedition = await ctx.prisma.expedition.findFirst({
      where: {
        attackerVillageId: newAttacker.villageId,
        targetRefId: targetPlayer.villageId,
      },
    });
    expect(expedition).not.toBeNull();
  });
});
