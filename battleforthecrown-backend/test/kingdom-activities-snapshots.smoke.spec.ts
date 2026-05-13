import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  truncateAll,
  type SmokeContext,
} from './helpers';

describe('kingdom activities snapshots smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await truncateAll(ctx.prisma);
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('returns open conquest windows for the current user and world sorted by capture deadline', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const otherWorld = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server, `conquest-user-${Date.now()}`);
    const otherUser = await registerUser(
      ctx.server,
      `conquest-other-${Date.now()}`,
    );
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'north-keep',
    );
    const otherJoin = await joinWorld(
      ctx.server,
      otherUser.accessToken,
      world.id,
      'rival-keep',
    );
    const foreignJoin = await joinWorld(
      ctx.server,
      user.accessToken,
      otherWorld.id,
      'foreign-keep',
    );

    const secondVillage = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        userId: user.userId,
        name: 'south-keep',
        x: join.village.x + 10,
        y: join.village.y + 10,
      },
    });
    const soonTarget = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        name: 'soon-camp',
        x: join.village.x + 1,
        y: join.village.y,
        isBarbarian: true,
        tier: 'T3',
      },
    });
    const laterTarget = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        name: 'later-camp',
        x: secondVillage.x + 1,
        y: secondVillage.y,
        isBarbarian: true,
        tier: 'T4',
      },
    });
    const hiddenTarget = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        name: 'hidden-camp',
        x: otherJoin.village.x + 1,
        y: otherJoin.village.y,
        isBarbarian: true,
      },
    });
    const foreignTarget = await ctx.prisma.village.create({
      data: {
        worldId: otherWorld.id,
        name: 'foreign-camp',
        x: foreignJoin.village.x + 1,
        y: foreignJoin.village.y,
        isBarbarian: true,
      },
    });

    const now = Date.now();
    await ctx.prisma.pendingConquest.createMany({
      data: [
        {
          attackerVillageId: secondVillage.id,
          attackerUserId: user.userId,
          targetVillageId: laterTarget.id,
          worldId: world.id,
          openedAt: new Date(now - 20_000),
          captureUntil: new Date(now + 120_000),
          status: 'OPEN',
        },
        {
          attackerVillageId: join.village.id,
          attackerUserId: user.userId,
          targetVillageId: soonTarget.id,
          worldId: world.id,
          openedAt: new Date(now - 10_000),
          captureUntil: new Date(now + 60_000),
          status: 'OPEN',
        },
        {
          attackerVillageId: otherJoin.village.id,
          attackerUserId: otherUser.userId,
          targetVillageId: hiddenTarget.id,
          worldId: world.id,
          captureUntil: new Date(now + 30_000),
          status: 'OPEN',
        },
        {
          attackerVillageId: foreignJoin.village.id,
          attackerUserId: user.userId,
          targetVillageId: foreignTarget.id,
          worldId: otherWorld.id,
          captureUntil: new Date(now + 15_000),
          status: 'OPEN',
        },
        {
          attackerVillageId: join.village.id,
          attackerUserId: user.userId,
          targetVillageId: hiddenTarget.id,
          worldId: world.id,
          captureUntil: new Date(now + 10_000),
          status: 'COMPLETED',
        },
      ],
    });

    const res = await request(ctx.server)
      .get('/combat/conquests/open')
      .query({ worldId: world.id })
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject([
      {
        attackerVillageId: join.village.id,
        attackerVillageName: 'north-keep',
        targetName: 'soon-camp',
        targetTier: 'T3',
        status: 'OPEN',
      },
      {
        attackerVillageId: secondVillage.id,
        attackerVillageName: 'south-keep',
        targetName: 'later-camp',
        targetTier: 'T4',
        status: 'OPEN',
      },
    ]);
  });

  it('returns active attack, scout and reinforce expeditions across user villages sorted by next deadline', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const otherWorld = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(
      ctx.server,
      `expedition-user-${Date.now()}`,
    );
    const otherUser = await registerUser(
      ctx.server,
      `expedition-other-${Date.now()}`,
    );
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'origin-a',
    );
    const secondVillage = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        userId: user.userId,
        name: 'origin-b',
        x: join.village.x + 8,
        y: join.village.y + 8,
      },
    });
    const targetA = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        name: 'target-a',
        x: join.village.x + 1,
        y: join.village.y,
        isBarbarian: true,
      },
    });
    const targetB = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        name: 'target-b',
        x: secondVillage.x + 1,
        y: secondVillage.y,
        isBarbarian: true,
      },
    });
    const otherJoin = await joinWorld(
      ctx.server,
      otherUser.accessToken,
      world.id,
      'other-origin',
    );
    const foreignJoin = await joinWorld(
      ctx.server,
      user.accessToken,
      otherWorld.id,
      'foreign-origin',
    );
    const foreignTarget = await ctx.prisma.village.create({
      data: {
        worldId: otherWorld.id,
        name: 'foreign-target',
        x: foreignJoin.village.x + 1,
        y: foreignJoin.village.y,
        isBarbarian: true,
      },
    });

    const now = Date.now();
    await ctx.prisma.expedition.createMany({
      data: [
        {
          worldId: world.id,
          attackerVillageId: join.village.id,
          kind: 'ATTACK',
          targetKind: 'BARBARIAN_VILLAGE',
          targetRefId: targetA.id,
          targetX: targetA.x,
          targetY: targetA.y,
          units: { MILITIA: 10, NOBLE: 1 },
          status: 'EN_ROUTE',
          departAt: new Date(now),
          arrivalAt: new Date(now + 120_000),
          outboundTravelMs: 120_000,
        },
        {
          worldId: world.id,
          attackerVillageId: secondVillage.id,
          kind: 'SCOUT',
          targetKind: 'BARBARIAN_VILLAGE',
          targetRefId: targetB.id,
          targetX: targetB.x,
          targetY: targetB.y,
          units: { SPY: 1 },
          status: 'RETURNING',
          departAt: new Date(now - 60_000),
          arrivalAt: new Date(now - 10_000),
          returnAt: new Date(now + 30_000),
          outboundTravelMs: 60_000,
          recalled: true,
        },
        {
          worldId: world.id,
          attackerVillageId: join.village.id,
          kind: 'REINFORCE',
          targetKind: 'PLAYER_VILLAGE',
          targetRefId: secondVillage.id,
          targetX: secondVillage.x,
          targetY: secondVillage.y,
          units: { MILITIA: 5 },
          status: 'RESOLVED',
          departAt: new Date(now - 90_000),
          arrivalAt: new Date(now - 30_000),
          outboundTravelMs: 60_000,
        },
        {
          worldId: world.id,
          attackerVillageId: otherJoin.village.id,
          kind: 'ATTACK',
          targetKind: 'BARBARIAN_VILLAGE',
          targetRefId: targetA.id,
          targetX: targetA.x,
          targetY: targetA.y,
          units: { MILITIA: 5 },
          status: 'EN_ROUTE',
          departAt: new Date(now),
          arrivalAt: new Date(now + 10_000),
          outboundTravelMs: 10_000,
        },
        {
          worldId: otherWorld.id,
          attackerVillageId: foreignJoin.village.id,
          kind: 'ATTACK',
          targetKind: 'BARBARIAN_VILLAGE',
          targetRefId: foreignTarget.id,
          targetX: foreignTarget.x,
          targetY: foreignTarget.y,
          units: { MILITIA: 5 },
          status: 'EN_ROUTE',
          departAt: new Date(now),
          arrivalAt: new Date(now + 20_000),
          outboundTravelMs: 20_000,
        },
      ],
    });

    const res = await request(ctx.server)
      .get('/combat/expeditions/open')
      .query({ worldId: world.id })
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject([
      {
        kind: 'SCOUT',
        attackerVillageId: secondVillage.id,
        attackerVillageName: 'origin-b',
        targetVillageId: targetB.id,
        targetName: 'target-b',
        status: 'RETURNING',
        recalled: true,
      },
      {
        kind: 'ATTACK',
        isConquest: true,
        attackerVillageId: join.village.id,
        attackerVillageName: 'origin-a',
        targetVillageId: targetA.id,
        targetName: 'target-a',
        status: 'EN_ROUTE',
        recalled: false,
      },
    ]);
  });
});
