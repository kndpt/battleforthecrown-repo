import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  truncateAll,
  type SmokeContext,
} from './helpers';

describe('village labels smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await truncateAll(ctx.prisma);
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('exposes capital, updates labels, validates values, and falls back after capital loss', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const owner = await registerUser(ctx.server, 'village-label-owner');
    const other = await registerUser(ctx.server, 'village-label-other');
    const join = await joinWorld(
      ctx.server,
      owner.accessToken,
      world.id,
      'first-village',
    );
    const firstConqueredAt = new Date(Date.now() + 1_000);
    const secondConqueredAt = new Date(Date.now() + 2_000);

    const conqueredEarly = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        userId: owner.userId,
        name: 'first-conquest',
        x: join.village.x + 4,
        y: join.village.y,
        isBarbarian: false,
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
        conqueredAt: firstConqueredAt,
      },
    });
    await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        userId: owner.userId,
        name: 'second-conquest',
        x: join.village.x + 5,
        y: join.village.y,
        isBarbarian: false,
        createdAt: new Date('2020-01-02T00:00:00.000Z'),
        conqueredAt: secondConqueredAt,
      },
    });

    const initialList = await request(ctx.server)
      .get('/village')
      .query({ worldId: world.id })
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(initialList.status).toBe(200);
    const initialVillages = initialList.body as Array<{
      id: string;
      label: string | null;
      isCapital: boolean;
    }>;
    expect(initialVillages).toHaveLength(3);
    expect(initialVillages.find((village) => village.isCapital)?.id).toBe(
      join.village.id,
    );

    const setLabel = await request(ctx.server)
      .patch(`/village/${conqueredEarly.id}/label`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ label: 'OFFENSIVE' });
    expect(setLabel.status).toBe(200);
    expect(setLabel.body).toMatchObject({
      id: conqueredEarly.id,
      label: 'OFFENSIVE',
    });

    const invalidLabel = await request(ctx.server)
      .patch(`/village/${conqueredEarly.id}/label`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ label: 'FAVORITE' });
    expect(invalidLabel.status).toBe(400);

    const forbidden = await request(ctx.server)
      .patch(`/village/${conqueredEarly.id}/label`)
      .set('Authorization', `Bearer ${other.accessToken}`)
      .send({ label: 'DEFENSIVE' });
    expect(forbidden.status).toBe(403);

    const clearLabel = await request(ctx.server)
      .patch(`/village/${conqueredEarly.id}/label`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ label: null });
    expect(clearLabel.status).toBe(200);
    expect(clearLabel.body).toMatchObject({
      id: conqueredEarly.id,
      label: null,
    });

    await ctx.prisma.village.update({
      where: { id: join.village.id },
      data: {
        userId: other.userId,
        conqueredAt: new Date('2026-05-03T00:00:00.000Z'),
      },
    });

    const afterCapitalLoss = await request(ctx.server)
      .get('/village')
      .query({ worldId: world.id })
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(afterCapitalLoss.status).toBe(200);
    const remainingVillages = afterCapitalLoss.body as Array<{
      id: string;
      isCapital: boolean;
    }>;
    expect(remainingVillages).toHaveLength(2);
    expect(remainingVillages.find((village) => village.isCapital)?.id).toBe(
      conqueredEarly.id,
    );
  });
});
