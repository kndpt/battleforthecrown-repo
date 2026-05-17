import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  outboxDispatched,
  registerUser,
  seedSmokeWorld,
  type SmokeContext,
} from './helpers';

describe('crowns smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('crown production: tick → crowns.changed dispatched for active membership', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    await joinWorld(ctx.server, user.accessToken, world.id, 'crown-village');

    // Backdate so the tick computes a non-zero production (event is gated on production > 0)
    await ctx.prisma.crownBalance.update({
      where: { userId_worldId: { userId: user.userId, worldId: world.id } },
      data: { lastUpdateTs: new Date(Date.now() - 86_400_000) },
    });

    await ctx.boss.send('crowns:production', {});

    const event = await outboxDispatched(
      ctx.prisma,
      { kind: 'crowns.changed', aggregateId: user.userId },
      { timeoutMs: 10_000 },
    );
    expect(event?.dispatchedAt).toBeTruthy();
  });

  it('crown production: tick → no crowns.changed when production rounds to 0', async () => {
    // Lock the inverse invariant of the previous test: when no crown was actually
    // produced (rate × elapsedHours < 1 → floor = 0), the worker must NOT emit
    // a crowns.changed event. The HUD is kept in sync by the REST seed +
    // client-side interpolation. cf. crowns.service.ts JSDoc.
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'crown-village-zero',
    );

    // No backdate — joinWorld sets lastUpdateTs to now, so elapsedHours ≈ 0.

    await ctx.boss.send('crowns:production', {});

    // Wait long enough for the worker to have processed the job (well past
    // the OutboxWorker poll interval) without seeing any crowns.changed for
    // this user.
    await new Promise((r) => setTimeout(r, 3_000));
    const event = await ctx.prisma.eventOutbox.findFirst({
      where: { kind: 'crowns.changed', aggregateId: user.userId },
    });
    expect(event).toBeNull();
  });

  it('strategy change: deducting crowns dispatches crowns.changed', async () => {
    // Locks the cross-module invariant documented in crowns.service.ts JSDoc:
    // any user-triggered mutation of CrownBalance.balance must emit its own
    // crowns.changed event — otherwise the HUD stays stale until the next
    // tick with production > 0.
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    const join = await joinWorld(
      ctx.server,
      user.accessToken,
      world.id,
      'strategy-village',
    );
    const villageId = join.village.id;

    await ctx.prisma.building.updateMany({
      where: { villageId, type: 'CASTLE' },
      data: { level: 4 },
    });
    await ctx.prisma.building.updateMany({
      where: { villageId, type: 'COUNCIL_HALL' },
      data: { level: 1 },
    });
    await ctx.prisma.resourceStock.update({
      where: { villageId },
      data: { wood: 1_000, stone: 1_000, iron: 1_000 },
    });

    // Give the user enough crowns to afford a paid first strategy change.
    await ctx.prisma.crownBalance.update({
      where: { userId_worldId: { userId: user.userId, worldId: world.id } },
      data: { balance: 10_000 },
    });

    const res = await request(ctx.server)
      .post(`/village/${villageId}/strategy`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ strategy: 'FORTRESS' });
    expect(res.status).toBeLessThan(300);
    expect(res.body).toMatchObject({
      cost: { wood: 200, stone: 100, iron: 50, crowns: 80 },
    });

    const event = await outboxDispatched(
      ctx.prisma,
      { kind: 'crowns.changed', aggregateId: user.userId },
      { timeoutMs: 10_000 },
    );
    expect(event?.dispatchedAt).toBeTruthy();
  });
});
