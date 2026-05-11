import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  truncateAll,
  type SmokeContext,
} from './helpers';

describe('army training read smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await truncateAll(ctx.prisma);
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('GET /army/:villageId/inventory and /training read UnitTraining with the current schema', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server, 'army-read' + Date.now());
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'army-read-village',
    );

    const inventory = await request(ctx.server)
      .get(`/army/${join.village.id}/inventory`)
      .set('Authorization', `Bearer ${user.accessToken}`);
    expect(inventory.status).toBe(200);
    expect(Array.isArray(inventory.body)).toBe(true);

    const training = await request(ctx.server)
      .get(`/army/${join.village.id}/training`)
      .set('Authorization', `Bearer ${user.accessToken}`);
    expect(training.status).toBe(200);
    expect(training.body).toEqual([]);
  });
});
