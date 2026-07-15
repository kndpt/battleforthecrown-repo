import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  type SmokeContext,
} from './helpers';

/**
 * Pins the hidden-gating divergence centralised in `InboxReportService`
 * (`mutationExcludesHidden`): on an already soft-deleted (`hidden`) inbox
 * entry, caravan mark-read/delete must 404 while the equivalent reinforcement
 * operations stay idempotent. Reads exclude hidden entries for both families.
 * A flip of the flag on either subclass would break exactly one assertion here.
 */
describe('inbox report hidden-gating smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  async function seedHiddenCaravan(worldId: string, userId: string) {
    const report = await ctx.prisma.caravanReport.create({
      data: {
        worldId,
        expeditionId: `exp-caravan-${userId}`,
        type: 'ARRIVED',
        originVillageId: 'origin-village',
        originX: 1,
        originY: 1,
        targetVillageId: 'target-village',
        targetX: 2,
        targetY: 2,
        resources: {},
        credited: {},
        returned: {},
        lost: {},
      },
    });
    await ctx.prisma.inboxEntry.create({
      data: {
        userId,
        worldId,
        kind: 'CARAVAN',
        caravanReportId: report.id,
        hidden: true,
      },
    });
    return report;
  }

  async function seedHiddenReinforcement(worldId: string, userId: string) {
    const report = await ctx.prisma.reinforcementReport.create({
      data: {
        worldId,
        type: 'STATIONED',
        originVillageId: 'origin-village',
        originX: 1,
        originY: 1,
        hostVillageId: 'host-village',
        hostX: 2,
        hostY: 2,
        units: {},
      },
    });
    await ctx.prisma.inboxEntry.create({
      data: {
        userId,
        worldId,
        kind: 'REINFORCEMENT',
        reinforcementReportId: report.id,
        hidden: true,
      },
    });
    return report;
  }

  it('caravan mark-read/delete 404 on a hidden entry; reinforcement stays idempotent', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const user = await registerUser(ctx.server);
    await joinWorld(ctx.server, user.accessToken, world.id, 'inbox-gating');

    const caravan = await seedHiddenCaravan(world.id, user.userId);
    const reinforcement = await seedHiddenReinforcement(world.id, user.userId);

    const auth = (req: request.Test) =>
      req
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('x-world-id', world.id);

    // Reads exclude hidden for both families.
    const caravanRead = await auth(
      request(ctx.server).get(`/combat/caravan-report/${caravan.id}`),
    );
    expect(caravanRead.status).toBe(404);
    const reinforcementRead = await auth(
      request(ctx.server).get(
        `/combat/reinforcement-report/${reinforcement.id}`,
      ),
    );
    expect(reinforcementRead.status).toBe(404);

    // Caravan: mutations refuse to act on a hidden entry.
    const caravanMark = await auth(
      request(ctx.server).patch(`/combat/caravan-report/${caravan.id}/read`),
    );
    expect(caravanMark.status).toBe(404);
    const caravanDelete = await auth(
      request(ctx.server).delete(`/combat/caravan-report/${caravan.id}`),
    );
    expect(caravanDelete.status).toBe(404);

    // Reinforcement: mutations stay idempotent on a hidden entry.
    const reinforcementMark = await auth(
      request(ctx.server).patch(
        `/combat/reinforcement-report/${reinforcement.id}/read`,
      ),
    );
    expect(reinforcementMark.status).toBeLessThan(300);
    const reinforcementDelete = await auth(
      request(ctx.server).delete(
        `/combat/reinforcement-report/${reinforcement.id}`,
      ),
    );
    expect(reinforcementDelete.status).toBeLessThan(300);

    // The reinforcement inbox entry stays hidden after the idempotent ops.
    const entry = await ctx.prisma.inboxEntry.findFirstOrThrow({
      where: { reinforcementReportId: reinforcement.id, userId: user.userId },
    });
    expect(entry.hidden).toBe(true);
    expect(entry.isRead).toBe(true);
  });
});
