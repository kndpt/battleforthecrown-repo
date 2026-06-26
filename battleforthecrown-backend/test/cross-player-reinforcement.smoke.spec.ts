import request from 'supertest';
import type { FriendshipDto } from '@battleforthecrown/shared/social';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  waitFor,
  type SmokeContext,
} from './helpers';

type Player = {
  userId: string;
  accessToken: string;
  displayName: string;
  villageId: string;
  x: number;
  y: number;
};

describe('cross-player reinforcement smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  async function newPlayer(worldId: string, tag: string): Promise<Player> {
    const user = await registerUser(ctx.server, `${tag}-${Date.now()}`);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      worldId,
      `v-${tag}`,
    );
    return {
      userId: user.userId,
      accessToken: user.accessToken,
      displayName: user.displayName,
      villageId: join.village.id,
      x: join.village.x,
      y: join.village.y,
    };
  }

  /** Drive the public endpoints to bring two players to an ACTIVE friendship. */
  async function makeActiveFriends(
    worldId: string,
    a: Player,
    b: Player,
  ): Promise<void> {
    const req = await request(ctx.server)
      .post(`/worlds/${worldId}/friendships`)
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({ recipientUserId: b.userId });
    expect(req.status).toBe(200);
    const friendshipId = (req.body as FriendshipDto).id;
    const accept = await request(ctx.server)
      .post(`/worlds/${worldId}/friendships/${friendshipId}/accept`)
      .set('Authorization', `Bearer ${b.accessToken}`);
    expect(accept.status).toBe(200);
  }

  async function giveArmy(villageId: string, militia: number): Promise<void> {
    await ctx.prisma.unitInventory.create({
      data: { villageId, unitType: 'MILITIA', quantity: militia },
    });
    await ctx.prisma.population.update({
      where: { villageId },
      data: { used: militia, max: militia * 2 },
    });
  }

  it('reinforces an ACTIVE friend village; pop stays on origin; non-friend is forbidden', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const a = await newPlayer(world.id, 'send');
    const b = await newPlayer(world.id, 'host');
    const stranger = await newPlayer(world.id, 'stranger');
    await makeActiveFriends(world.id, a, b);
    await giveArmy(a.villageId, 50);

    const hostPopBefore = await ctx.prisma.population.findUniqueOrThrow({
      where: { villageId: b.villageId },
    });

    // Reinforce friend B's village → allowed.
    const res = await request(ctx.server)
      .post('/combat/reinforce')
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({
        villageId: a.villageId,
        targetVillageId: b.villageId,
        units: { MILITIA: 30 },
      });
    expect(res.status).toBeLessThan(300);

    // Garrison lands on B's village but is owned by A's origin village.
    await waitFor(
      () =>
        ctx.prisma.garrison.findFirst({
          where: {
            villageId: b.villageId,
            originVillageId: a.villageId,
            quantity: 30,
          },
        }),
      { timeoutMs: 30_000 },
    );

    // Pop accounting: origin A consumed, host B unchanged (no transfer).
    const originPop = await ctx.prisma.population.findUniqueOrThrow({
      where: { villageId: a.villageId },
    });
    expect(originPop.used).toBe(50);
    const hostPopAfter = await ctx.prisma.population.findUniqueOrThrow({
      where: { villageId: b.villageId },
    });
    expect(hostPopAfter.used).toBe(hostPopBefore.used);

    // Reinforcing a non-friend, non-owned village → forbidden.
    const forbidden = await request(ctx.server)
      .post('/combat/reinforce')
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({
        villageId: a.villageId,
        targetVillageId: stranger.villageId,
        units: { MILITIA: 5 },
      });
    expect(forbidden.status).toBe(403);
  });

  it('blocks reinforcement of a friend village under an OPEN capture window', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const a = await newPlayer(world.id, 'cw-send');
    const b = await newPlayer(world.id, 'cw-host');
    await makeActiveFriends(world.id, a, b);
    await giveArmy(a.villageId, 20);

    // Simulate B's village being under an open PvP capture window.
    await ctx.prisma.pendingConquest.create({
      data: {
        attackerVillageId: a.villageId, // any village; the guard keys on target
        attackerUserId: a.userId,
        targetVillageId: b.villageId,
        worldId: world.id,
        captureUntil: new Date(Date.now() + 60 * 60 * 1000),
        status: 'OPEN',
      },
    });

    const res = await request(ctx.server)
      .post('/combat/reinforce')
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({
        villageId: a.villageId,
        targetVillageId: b.villageId,
        units: { MILITIA: 10 },
      });
    expect(res.status).toBe(403);
  });

  it('scout report reveals the target owner ACTIVE defensive friends', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const scout = await newPlayer(world.id, 'spy');
    const defender = await newPlayer(world.id, 'def');
    const friend1 = await newPlayer(world.id, 'f1');
    const friend2 = await newPlayer(world.id, 'f2');

    // Defender is ACTIVE friends with friend1 and friend2.
    await makeActiveFriends(world.id, defender, friend1);
    await makeActiveFriends(world.id, friend2, defender);

    // Equip the scout: spies in inventory + a watchtower, defender placed in range.
    await ctx.prisma.unitInventory.create({
      data: { villageId: scout.villageId, unitType: 'SPY', quantity: 2 },
    });
    await ctx.prisma.building.updateMany({
      where: { villageId: scout.villageId, type: 'WATCHTOWER' },
      data: { level: 1 },
    });
    await ctx.prisma.village.update({
      where: { id: defender.villageId },
      data: { x: scout.x + 1, y: scout.y },
    });

    const res = await request(ctx.server)
      .post('/combat/scout')
      .set('Authorization', `Bearer ${scout.accessToken}`)
      .send({
        villageId: scout.villageId,
        targetX: scout.x + 1,
        targetY: scout.y,
        targetKind: 'PLAYER_VILLAGE',
        targetRefId: defender.villageId,
        units: { SPY: 1 },
      });
    expect(res.status).toBeLessThan(300);

    const report = await waitFor(
      () =>
        ctx.prisma.scoutReport.findFirst({
          where: {
            scoutVillageId: scout.villageId,
            targetVillageId: defender.villageId,
          },
        }),
      { timeoutMs: 30_000 },
    );
    const names = (report.details as Record<string, unknown>)
      .defensiveFriendsDisplayNames as string[] | undefined;
    expect(names).toBeDefined();
    expect(names).toEqual(
      expect.arrayContaining([friend1.displayName, friend2.displayName]),
    );
    expect(names).toHaveLength(2);
  });
});
