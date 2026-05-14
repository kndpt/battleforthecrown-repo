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

    const entities = res.body as Array<{
      id: string;
      kind: string;
      x: number;
      y: number;
    }>;
    const found = entities.find((e) => e.x === foggedX && e.y === foggedY);
    expect(found).toBeTruthy();
    expect(found?.kind).toBe('fogged');
  });
});
