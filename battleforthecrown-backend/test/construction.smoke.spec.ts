import request from 'supertest';
import { getFarmPopulationLimit } from '@battleforthecrown/shared/village';
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

  it('construction: accepts FARM when an ECONOMIC population bonus covers the cost', async () => {
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
      where: { villageId, type: 'FARM' },
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
      .send({ buildingType: 'FARM' });

    expect(res.status).toBeLessThan(300);
    await expect(
      ctx.prisma.population.findUniqueOrThrow({ where: { villageId } }),
    ).resolves.toMatchObject({ used: 275, max: 250 });
  });

  it('construction: completing FARM refreshes max population', async () => {
    const world = await seedSmokeWorld(ctx.prisma, `build-farm-${Date.now()}`);
    const user = await registerUser(ctx.server, 'build-farm');
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'build-farm-village',
    );
    const villageId = join.village.id;

    await ctx.prisma.building.updateMany({
      where: { villageId, type: 'FARM' },
      data: { level: 1, startTime: null, endTime: null },
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
      data: { max: getFarmPopulationLimit(1) },
    });

    const res = await request(ctx.server)
      .post(`/village/${villageId}/upgrade`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ buildingType: 'FARM' });

    expect(res.status).toBeLessThan(300);
    await waitFor(
      async () => {
        const population = await ctx.prisma.population.findUniqueOrThrow({
          where: { villageId },
        });
        return population.max === getFarmPopulationLimit(2) ? population : null;
      },
      { timeoutMs: 15_000 },
    );
  });
});
