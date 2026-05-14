import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  truncateAll,
  waitFor,
  type SmokeContext,
} from './helpers';

describe('production tick smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await truncateAll(ctx.prisma);
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('production tick: ResourceStock.lastUpdateTs is bumped for active villages', async () => {
    // ProductionWorker does NOT emit resources.changed by design — frontend
    // interpolates between mutation-driven events (cf. production.worker.ts).
    // We assert on the DB side-effect (lastUpdateTs progression) instead.
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'tick-village',
    );
    const villageId = join.village.id;

    const before = await ctx.prisma.resourceStock.findUniqueOrThrow({
      where: { villageId },
    });
    await new Promise((r) => setTimeout(r, 1100));
    await ctx.boss.send('production:tick', {});

    await waitFor(
      async () => {
        const after = await ctx.prisma.resourceStock.findUniqueOrThrow({
          where: { villageId },
        });
        return after.lastUpdateTs > before.lastUpdateTs ? after : null;
      },
      { timeoutMs: 10_000 },
    );
  });
});
