import { bootSmokeApp, seedSmokeWorld, truncateAll, type SmokeContext } from './helpers';

describe('smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await truncateAll(ctx.prisma);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('boots the app and seeds a smoke world', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const found = await ctx.prisma.world.findUnique({ where: { id: world.id } });
    expect(found).not.toBeNull();
    expect(found?.status).toBe('OPEN');
  });
});
