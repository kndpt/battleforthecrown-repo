import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  truncateAll,
  type SmokeContext,
} from './helpers';

describe('vision smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await truncateAll(ctx.prisma);
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
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

    const body = res.body as {
      entities: Array<{
        id: string;
        kind: string;
        x: number;
        y: number;
      }>;
      visionDisks: Array<{ x: number; y: number; radius: number }>;
      fogOfWarEnabled: boolean;
    };
    const found = body.entities.find((e) => e.x === foggedX && e.y === foggedY);
    expect(body.fogOfWarEnabled).toBe(true);
    expect(body.visionDisks).toEqual([]);
    expect(found).toBeTruthy();
    expect(found?.kind).toBe('fogged');
  });

  it('fog of war: GET /world/:id/entities exposes player villages from Village with fog applied', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const viewer = await registerUser(ctx.server, `viewer-${Date.now()}`);
    const visibleOwner = await registerUser(
      ctx.server,
      `visible-owner-${Date.now()}`,
    );
    const hiddenOwner = await registerUser(
      ctx.server,
      `hidden-owner-${Date.now()}`,
    );

    await ctx.prisma.worldMembership.createMany({
      data: [
        { userId: viewer.userId, worldId: world.id },
        { userId: visibleOwner.userId, worldId: world.id },
        { userId: hiddenOwner.userId, worldId: world.id },
      ],
    });

    const viewerVillage = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        userId: viewer.userId,
        isBarbarian: false,
        name: 'viewer-village',
        x: 100,
        y: 100,
        buildings: {
          create: { type: 'WATCHTOWER', level: 2 },
        },
      },
    });
    const visibleVillage = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        userId: visibleOwner.userId,
        isBarbarian: false,
        name: 'visible-player-village',
        x: 109,
        y: 100,
      },
    });
    const hiddenVillage = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        userId: hiddenOwner.userId,
        isBarbarian: false,
        name: 'hidden-player-village',
        x: 130,
        y: 100,
      },
    });

    const res = await request(ctx.server)
      .get(`/world/${world.id}/entities`)
      .set('Authorization', `Bearer ${viewer.accessToken}`);
    expect(res.status).toBe(200);

    const body = res.body as {
      entities: Array<{
        id: string;
        kind: string;
        x: number;
        y: number;
        worldId?: string;
        data?: { userId?: string; name?: string; villageId?: string };
      }>;
      visionDisks: Array<{ x: number; y: number; radius: number }>;
      fogOfWarEnabled: boolean;
    };

    expect(body.fogOfWarEnabled).toBe(true);
    expect(body.visionDisks).toEqual([
      { x: viewerVillage.x, y: viewerVillage.y, radius: 10 },
    ]);

    const visible = body.entities.find((e) => e.id === visibleVillage.id);
    expect(visible).toMatchObject({
      id: visibleVillage.id,
      worldId: world.id,
      kind: 'PLAYER_VILLAGE',
      x: visibleVillage.x,
      y: visibleVillage.y,
      data: {
        userId: visibleOwner.userId,
        name: 'visible-player-village',
        villageId: visibleVillage.id,
      },
    });

    const hidden = body.entities.find((e) => e.id === hiddenVillage.id);
    expect(hidden).toEqual({
      id: hiddenVillage.id,
      kind: 'fogged',
      x: hiddenVillage.x,
      y: hiddenVillage.y,
    });
  });

  it('fog of war: entities response exposes multi-village vision disks and uses their union', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'two-tower-kingdom',
    );

    await ctx.prisma.building.updateMany({
      where: { villageId: join.village.id, type: 'WATCHTOWER' },
      data: { level: 2 },
    });

    const secondX =
      join.village.x > 250 ? join.village.x - 100 : join.village.x + 100;
    const secondY = join.village.y;
    await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        userId: user.userId,
        isBarbarian: false,
        name: 'second-watchtower',
        x: secondX,
        y: secondY,
        buildings: {
          create: { type: 'WATCHTOWER', level: 4 },
        },
      },
    });

    await ctx.prisma.village.createMany({
      data: [
        {
          worldId: world.id,
          isBarbarian: true,
          name: 'inside-first-disk',
          x: join.village.x + 9,
          y: join.village.y,
          tier: 'T1',
        },
        {
          worldId: world.id,
          isBarbarian: true,
          name: 'inside-second-disk',
          x: secondX + 19,
          y: secondY,
          tier: 'T1',
        },
        {
          worldId: world.id,
          isBarbarian: true,
          name: 'outside-all-disks',
          x: secondX,
          y: secondY + 60,
          tier: 'T1',
        },
      ],
    });

    const res = await request(ctx.server)
      .get(`/world/${world.id}/entities`)
      .set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.status).toBe(200);

    const body = res.body as {
      entities: Array<{
        id: string;
        kind: string;
        x: number;
        y: number;
        data?: { name?: string };
      }>;
      visionDisks: Array<{ x: number; y: number; radius: number }>;
      fogOfWarEnabled: boolean;
    };
    expect(body.fogOfWarEnabled).toBe(true);
    expect(body.visionDisks).toEqual(
      expect.arrayContaining([
        { x: join.village.x, y: join.village.y, radius: 10 },
        { x: secondX, y: secondY, radius: 20 },
      ]),
    );

    const insideFirst = body.entities.find(
      (e) => e.data?.name === 'inside-first-disk',
    );
    const insideSecond = body.entities.find(
      (e) => e.data?.name === 'inside-second-disk',
    );
    const outside = body.entities.find(
      (e) => e.x === secondX && e.y === secondY + 60,
    );
    expect(insideFirst?.kind).toBe('BARBARIAN_VILLAGE');
    expect(insideSecond?.kind).toBe('BARBARIAN_VILLAGE');
    expect(outside?.kind).toBe('fogged');
  });
});
