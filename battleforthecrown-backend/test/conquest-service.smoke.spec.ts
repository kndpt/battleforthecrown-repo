import {
  bootSmokeApp,
  joinWorld,
  outboxDispatched,
  registerUser,
  seedSmokeWorld,
  truncateAll,
  type SmokeContext,
} from './helpers';
import { ConquestService } from '../src/modules/combat/conquest.service';

describe('conquest service smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await truncateAll(ctx.prisma);
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('conquest: ConquestService → village.userId reassigned + village.conquered dispatched', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'conqueror',
    );
    const attackerId = join.village.id;

    const barbarian = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        isBarbarian: true,
        name: 'barb-conquer-target',
        x: join.village.x + 1,
        y: join.village.y,
        tier: 'T1',
        resourceStock: {
          create: { wood: 0, stone: 0, iron: 0, maxPerType: 100_000 },
        },
      },
    });

    const conquest = ctx.app.get(ConquestService);
    const result = await conquest.conquerVillage({
      attackerVillageId: attackerId,
      targetVillageId: barbarian.id,
      attackerUserId: user.userId,
    });
    expect(result.success).toBe(true);

    const conquered = await ctx.prisma.village.findUniqueOrThrow({
      where: { id: barbarian.id },
    });
    expect(conquered.userId).toBe(user.userId);

    const event = await outboxDispatched(
      ctx.prisma,
      { kind: 'village.conquered', aggregateId: barbarian.id },
      { timeoutMs: 5_000 },
    );
    expect(event?.dispatchedAt).toBeTruthy();
  });
});
