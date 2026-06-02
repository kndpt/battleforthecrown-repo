import request from 'supertest';
import {
  BUILDING_DEFINITIONS,
  BUILDING_TYPES,
  getQuarterPopulationLimit,
} from '@battleforthecrown/shared/village';
import { SMOKE_WORLD_CONFIG } from './fixtures/smoke-world-config';
import {
  bootSmokeApp,
  joinWorld,
  outboxDispatched,
  registerUser,
  seedSmokeWorld,
  waitFor,
  type SmokeContext,
} from './helpers';

describe('construction smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('construction: upgrade WOOD → Building.level=2 + building.completed dispatched', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'build-village',
    );
    const villageId = join.village.id;

    await ctx.prisma.resourceStock.update({
      where: { villageId },
      data: {
        wood: 1_000_000,
        stone: 1_000_000,
        iron: 1_000_000,
        maxPerType: 10_000_000,
      },
    });

    const res = await request(ctx.server)
      .post(`/village/${villageId}/upgrade`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ buildingType: 'WOOD' });
    expect(res.status).toBeLessThan(300);

    const upgradedBuilding = await waitFor(
      () =>
        ctx.prisma.building.findFirst({
          where: { villageId, type: 'WOOD', level: 2 },
        }),
      { timeoutMs: 10_000 },
    );

    const event = await outboxDispatched(
      ctx.prisma,
      { kind: 'building.completed', aggregateId: upgradedBuilding.id },
      { timeoutMs: 10_000 },
    );
    expect(event?.dispatchedAt).toBeTruthy();
  });

  it('construction: cancel returns refunded resources and population payload', async () => {
    const world = await seedSmokeWorld(
      ctx.prisma,
      `build-cancel-${Date.now()}`,
    );
    await ctx.prisma.world.update({
      where: { id: world.id },
      data: {
        config: {
          ...SMOKE_WORLD_CONFIG,
          tempo: {
            ...SMOKE_WORLD_CONFIG.tempo,
            overrides: {
              ...SMOKE_WORLD_CONFIG.tempo.overrides,
              constructionSpeed: 1,
            },
          },
        },
      },
    });
    const user = await registerUser(ctx.server, 'build-cancel');
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'build-cancel-village',
    );
    const villageId = join.village.id;
    const expectedRefund =
      BUILDING_DEFINITIONS[BUILDING_TYPES.QUARTER].levels[1];

    await ctx.prisma.building.updateMany({
      where: { villageId, type: BUILDING_TYPES.QUARTER },
      data: { level: 0, startTime: null, endTime: null },
    });
    await ctx.prisma.resourceStock.update({
      where: { villageId },
      data: {
        wood: 1_000_000,
        stone: 1_000_000,
        iron: 1_000_000,
        maxPerType: 10_000_000,
      },
    });
    await ctx.prisma.population.update({
      where: { villageId },
      data: { used: 0, max: 1000 },
    });

    const upgrade = await request(ctx.server)
      .post(`/village/${villageId}/upgrade`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ buildingType: BUILDING_TYPES.QUARTER });
    expect(upgrade.status).toBeLessThan(300);

    const quarter = await ctx.prisma.building.findFirstOrThrow({
      where: { villageId, type: BUILDING_TYPES.QUARTER },
    });
    expect(quarter.endTime).toBeTruthy();

    const cancel = await request(ctx.server)
      .delete(`/village/${villageId}/buildings/${quarter.id}/cancel`)
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(cancel.status).toBeLessThan(300);
    expect(cancel.body).toEqual({
      success: true,
      refunded: {
        wood: expectedRefund.wood,
        stone: expectedRefund.stone,
        iron: expectedRefund.iron,
        population: expectedRefund.population,
      },
    });
  });

  it('construction: accepts QUARTER when an ECONOMIC population bonus covers the cost', async () => {
    const world = await seedSmokeWorld(ctx.prisma, `build-pop-${Date.now()}`);
    const user = await registerUser(ctx.server, 'build-pop');
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'build-pop-village',
    );
    const villageId = join.village.id;

    await ctx.prisma.villageStrategyConfig.upsert({
      where: { villageId },
      create: { villageId, strategy: 'ECONOMIC' },
      update: { strategy: 'ECONOMIC' },
    });
    await ctx.prisma.building.updateMany({
      where: { villageId, type: 'QUARTER' },
      data: { level: 0, startTime: null, endTime: null },
    });
    await ctx.prisma.resourceStock.update({
      where: { villageId },
      data: {
        wood: 1_000_000,
        stone: 1_000_000,
        iron: 1_000_000,
        maxPerType: 10_000_000,
      },
    });
    await ctx.prisma.population.update({
      where: { villageId },
      data: { used: 270, max: 250 },
    });

    const res = await request(ctx.server)
      .post(`/village/${villageId}/upgrade`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ buildingType: 'QUARTER' });

    expect(res.status).toBeLessThan(300);
    await expect(
      ctx.prisma.population.findUniqueOrThrow({ where: { villageId } }),
    ).resolves.toMatchObject({ used: 275, max: 250 });
  });

  it('construction: completing QUARTER 7 → 8 refreshes max population', async () => {
    const world = await seedSmokeWorld(
      ctx.prisma,
      `build-quarter-${Date.now()}`,
    );
    await ctx.prisma.world.update({
      where: { id: world.id },
      data: {
        config: {
          ...SMOKE_WORLD_CONFIG,
          tempo: {
            ...SMOKE_WORLD_CONFIG.tempo,
            overrides: {
              ...SMOKE_WORLD_CONFIG.tempo.overrides,
              constructionSpeed: 0.000001,
            },
          },
        },
      },
    });
    const user = await registerUser(ctx.server, 'build-quarter');
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'build-quarter-village',
    );
    const villageId = join.village.id;

    await ctx.prisma.building.updateMany({
      where: { villageId, type: 'QUARTER' },
      data: { level: 7, startTime: null, endTime: null },
    });
    await ctx.prisma.resourceStock.update({
      where: { villageId },
      data: {
        wood: 1_000_000,
        stone: 1_000_000,
        iron: 1_000_000,
        maxPerType: 10_000_000,
      },
    });
    await ctx.prisma.population.update({
      where: { villageId },
      data: { max: getQuarterPopulationLimit(7) },
    });

    const res = await request(ctx.server)
      .post(`/village/${villageId}/upgrade`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ buildingType: 'QUARTER' });

    expect(res.status).toBeLessThan(300);
    await waitFor(
      async () => {
        const population = await ctx.prisma.population.findUniqueOrThrow({
          where: { villageId },
        });
        return population.max === getQuarterPopulationLimit(8)
          ? population
          : null;
      },
      { timeoutMs: 15_000 },
    );
  });
});
