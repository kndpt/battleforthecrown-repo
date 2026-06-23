import request from 'supertest';
import type { PublicPlayerProfileResponse } from '@battleforthecrown/shared';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  type SmokeContext,
} from './helpers';

/**
 * Run 082 — public player profile + newbie-shield badge.
 *
 * Asserts the JWT-protected `GET /worlds/:worldId/users/:userId/public-profile`
 * route: exact public shape (no private leak), live shield mapping, and 404 for
 * a non-member target (a barbarian has no User/membership → same path).
 */
describe('public player profile smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  /** Attacker with MILITIA + WATCHTOWER lvl 1 (vision) — fresh shield on join. */
  async function setupAttacker(worldId: string, villageName: string) {
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      worldId,
      villageName,
    );
    await ctx.prisma.unitInventory.create({
      data: { villageId: join.village.id, unitType: 'MILITIA', quantity: 50 },
    });
    await ctx.prisma.building.updateMany({
      where: { villageId: join.village.id, type: 'WATCHTOWER' },
      data: { level: 1 },
    });
    return {
      userId: user.userId,
      accessToken: user.accessToken,
      villageId: join.village.id,
      x: join.village.x,
      y: join.village.y,
    };
  }

  /** Protected defender adjacent to attacker (fresh membership → shield active). */
  async function setupDefender(
    worldId: string,
    attackerX: number,
    attackerY: number,
    villageName: string,
  ) {
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
    await ctx.prisma.unitInventory.create({
      data: { villageId: village.id, unitType: 'MILITIA', quantity: 1000 },
    });
    await ctx.prisma.worldMembership.create({
      data: { userId: user.userId, worldId, joinedAt: new Date() },
    });
    return {
      userId: user.userId,
      villageId: village.id,
      x: village.x,
      y: village.y,
    };
  }

  it('case 1: breaking attacker shield via PvP → attacker profile newbieShield null, protected player active', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const attacker = await setupAttacker(world.id, 'profile-attacker-1');
    // Victim must be UNPROTECTED, else attacking it is blocked by the defender's
    // own shield (403 NEWBIE_SHIELD_ACTIVE) before the attacker's shield breaks.
    const victim = await setupDefender(
      world.id,
      attacker.x,
      attacker.y,
      'profile-victim-1',
    );
    await ctx.prisma.worldMembership.update({
      where: { userId_worldId: { userId: victim.userId, worldId: world.id } },
      data: { joinedAt: new Date(Date.now() - 49 * 60 * 60 * 1000) },
    });
    // A separate, freshly-joined player stays protected — for the active assert.
    const protectedPlayer = await setupDefender(
      world.id,
      attacker.x,
      attacker.y + 4,
      'profile-protected-1',
    );

    // Outgoing PvP attack breaks attacker's own shield (spec 14 § 3).
    const attackRes = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({
        villageId: attacker.villageId,
        targetX: victim.x,
        targetY: victim.y,
        targetKind: 'PLAYER_VILLAGE',
        targetRefId: victim.villageId,
        units: { MILITIA: 10 },
      });
    expect(attackRes.status).toBeLessThan(300);

    // Attacker profile: shield broken → null.
    const attackerProfile = await request(ctx.server)
      .get(`/worlds/${world.id}/users/${attacker.userId}/public-profile`)
      .set('Authorization', `Bearer ${attacker.accessToken}`);
    expect(attackerProfile.status).toBe(200);
    const attackerBody = attackerProfile.body as PublicPlayerProfileResponse;
    expect(attackerBody).toMatchObject({
      userId: attacker.userId,
      newbieShield: null,
    });
    // Exact public shape — no private leak (renown, villages, crowns, army…).
    expect(Object.keys(attackerBody).sort()).toEqual(
      ['displayName', 'kingdomPower', 'newbieShield', 'userId'].sort(),
    );
    expect(typeof attackerBody.displayName).toBe('string');
    expect(typeof attackerBody.kingdomPower).toBe('number');

    // Protected player profile: still protected → newbieShield active.
    const protectedProfile = await request(ctx.server)
      .get(`/worlds/${world.id}/users/${protectedPlayer.userId}/public-profile`)
      .set('Authorization', `Bearer ${attacker.accessToken}`);
    expect(protectedProfile.status).toBe(200);
    const protectedBody = protectedProfile.body as PublicPlayerProfileResponse;
    expect(protectedBody.newbieShield).toMatchObject({ active: true });
    // endsAt must be a parseable date in the future — it drives the client timer.
    const endsAt = protectedBody.newbieShield?.endsAt;
    expect(typeof endsAt).toBe('string');
    expect(Number.isNaN(Date.parse(String(endsAt)))).toBe(false);
    expect(Date.parse(String(endsAt))).toBeGreaterThan(Date.now());
  });

  it('case 2: non-member target (also covers barbarian: no User/membership) → 404', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const requester = await setupAttacker(world.id, 'profile-requester-2');
    // A registered user who never joined this world has no membership.
    const stranger = await registerUser(ctx.server);

    const res = await request(ctx.server)
      .get(`/worlds/${world.id}/users/${stranger.userId}/public-profile`)
      .set('Authorization', `Bearer ${requester.accessToken}`);
    expect(res.status).toBe(404);
    expect((res.body as { message?: unknown }).message).toBe(
      'USER_NOT_MEMBER_OF_WORLD',
    );
  });

  it('case 3: unauthenticated request → 401 (JWT-protected route)', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const attacker = await setupAttacker(world.id, 'profile-attacker-3');

    const res = await request(ctx.server).get(
      `/worlds/${world.id}/users/${attacker.userId}/public-profile`,
    );
    expect(res.status).toBe(401);
  });
});
