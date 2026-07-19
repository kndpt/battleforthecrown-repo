import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  type SmokeContext,
} from './helpers';

/**
 * Taxonomie v2 des traits naturels (spec 27) : le trait FERTILE_SOIL (Terre
 * fertile) applique un bonus de population plat via l'endpoint GET /population,
 * multiplicativement avec le facteur strategy. Deux villages identiques
 * (population.max + strategy BALANCED par défaut) ne diffèrent que par le trait.
 */
describe('natural trait population smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  async function seedVillage(tag: string, worldId: string) {
    const user = await registerUser(ctx.server, tag);
    const joined = await joinWorld(ctx.server, user.accessToken, worldId, tag);
    return { user, villageId: joined.village.id };
  }

  async function getMaxPopulation(
    villageId: string,
    accessToken: string,
  ): Promise<number> {
    const res = await request(ctx.server)
      .get('/population')
      .query({ villageId })
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    return (res.body as { max: number }).max;
  }

  it('FERTILE_SOIL raises max population by the flat trait factor; other traits stay neutral', async () => {
    const world = await seedSmokeWorld(ctx.prisma, `trait-pop-${Date.now()}`);
    const fertile = await seedVillage('trait-fertile', world.id);
    const plains = await seedVillage('trait-plains', world.id);

    // Identical base: same stored population.max, no strategy config (both
    // default BALANCED → population multiplier 1). Only the trait differs.
    const BASE_MAX = 250;
    for (const villageId of [fertile.villageId, plains.villageId]) {
      await ctx.prisma.population.update({
        where: { villageId },
        data: { max: BASE_MAX, used: 0 },
      });
    }
    await ctx.prisma.village.update({
      where: { id: fertile.villageId },
      data: { naturalTrait: 'FERTILE_SOIL' },
    });
    await ctx.prisma.village.update({
      where: { id: plains.villageId },
      data: { naturalTrait: 'PLAINS' },
    });

    const fertileMax = await getMaxPopulation(
      fertile.villageId,
      fertile.user.accessToken,
    );
    const plainsMax = await getMaxPopulation(
      plains.villageId,
      plains.user.accessToken,
    );

    // PLAINS neutral == stored base; FERTILE_SOIL == base × 1.10 (flat).
    expect(plainsMax).toBe(BASE_MAX);
    expect(fertileMax).toBe(Math.floor(BASE_MAX * 1.1));
    expect(fertileMax).toBeGreaterThan(plainsMax);

    // Regression : a second non-FERTILE trait (HILL) leaves max population
    // unchanged — only FERTILE_SOIL is population-bearing in v2.
    await ctx.prisma.village.update({
      where: { id: plains.villageId },
      data: { naturalTrait: 'HILL' },
    });
    const hillMax = await getMaxPopulation(
      plains.villageId,
      plains.user.accessToken,
    );
    expect(hillMax).toBe(BASE_MAX);
  }, 30_000);
});
