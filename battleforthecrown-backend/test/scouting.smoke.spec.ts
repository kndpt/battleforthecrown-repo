import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  waitFor,
  type SmokeContext,
} from './helpers';

async function getVillagePower(
  server: SmokeContext['server'],
  accessToken: string,
  villageId: string,
): Promise<{ army: number }> {
  const res = await request(server)
    .get('/power')
    .query({ villageId })
    .set('Authorization', `Bearer ${accessToken}`);
  expect(res.status).toBe(200);
  return res.body as { army: number };
}

describe('scouting smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('scouting: SPY-only mission snapshots visible targets and returns spies', async () => {
    const world = await seedSmokeWorld(ctx.prisma);
    const attacker = await registerUser(ctx.server);
    const defender = await registerUser(ctx.server, `scout-def-${Date.now()}`);
    const join = await joinWorld(
      ctx.server,
      attacker.accessToken,
      world.id,
      'scout-origin',
    );
    const attackerId = join.village.id;

    const barracks = await ctx.prisma.building.findFirstOrThrow({
      where: { villageId: attackerId, type: 'BARRACKS' },
    });
    await ctx.prisma.building.update({
      where: { id: barracks.id },
      data: { level: 2 },
    });
    await ctx.prisma.building.updateMany({
      where: { villageId: attackerId, type: 'WATCHTOWER' },
      data: { level: 1 },
    });
    await ctx.prisma.resourceStock.update({
      where: { villageId: attackerId },
      data: {
        wood: 100_000,
        stone: 100_000,
        iron: 100_000,
        maxPerType: 1_000_000,
      },
    });
    await ctx.prisma.population.update({
      where: { villageId: attackerId },
      data: { used: 0, max: 100 },
    });

    const lockedSpy = await request(ctx.server)
      .post(`/army/${attackerId}/train`)
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({ unitType: 'SPY', quantity: 1 });
    expect(lockedSpy.status).toBe(400);

    await ctx.prisma.building.update({
      where: { id: barracks.id },
      data: { level: 3 },
    });

    const trainSpy = await request(ctx.server)
      .post(`/army/${attackerId}/train`)
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({ unitType: 'SPY', quantity: 2 });
    expect(trainSpy.status).toBeLessThan(300);

    await waitFor(
      () =>
        ctx.prisma.unitInventory.findFirst({
          where: { villageId: attackerId, unitType: 'SPY', quantity: 2 },
        }),
      { timeoutMs: 10_000 },
    );

    const powerBeforeScout = await getVillagePower(
      ctx.server,
      attacker.accessToken,
      attackerId,
    );
    expect(powerBeforeScout.army).toBe(20);

    const barbarian = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        isBarbarian: true,
        name: 'scout-barbarian',
        x: join.village.x + 1,
        y: join.village.y,
        tier: 'T1',
        resourceStock: {
          create: { wood: 321, stone: 222, iron: 123, maxPerType: 321 },
        },
      },
    });
    await ctx.prisma.unitInventory.create({
      data: { villageId: barbarian.id, unitType: 'MILITIA', quantity: 7 },
    });

    const playerTarget = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        userId: defender.userId,
        isBarbarian: false,
        name: 'scout-player',
        x: join.village.x + 2,
        y: join.village.y,
        resourceStock: {
          create: { wood: 456, stone: 345, iron: 234, maxPerType: 100_000 },
        },
        strategyConfig: { create: { strategy: 'RAIDERS' } },
        buildings: { create: { type: 'CASTLE', level: 6 } },
      },
    });
    await ctx.prisma.unitInventory.create({
      data: { villageId: playerTarget.id, unitType: 'SQUIRE', quantity: 3 },
    });
    // Fresh membership for the target owner → newbie shield active at scout time.
    await ctx.prisma.worldMembership.create({
      data: { userId: defender.userId, worldId: world.id },
    });

    const publicVillages = await request(ctx.server)
      .get(`/world/${world.id}/villages`)
      .query({ centerX: join.village.x, centerY: join.village.y, radius: 5 })
      .set('Authorization', `Bearer ${attacker.accessToken}`);
    expect(publicVillages.status).toBe(200);
    const publicTarget = (
      publicVillages.body as Array<Record<string, unknown>>
    ).find((entity) => entity.id === playerTarget.id);
    expect(publicTarget).toBeTruthy();
    expect(JSON.stringify(publicTarget)).not.toContain('RAIDERS');

    const nonSpy = await request(ctx.server)
      .post('/combat/scout')
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({
        villageId: attackerId,
        targetX: barbarian.x,
        targetY: barbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: barbarian.id,
        units: { MILITIA: 1 },
      });
    expect(nonSpy.status).toBe(400);

    const scoutBarb = await request(ctx.server)
      .post('/combat/scout')
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({
        villageId: attackerId,
        targetX: barbarian.x,
        targetY: barbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: barbarian.id,
        units: { SPY: 1 },
      });
    expect(scoutBarb.status).toBeLessThan(300);
    const barbExpeditionId = (scoutBarb.body as { id: string }).id;

    const powerAfterScoutDispatch = await getVillagePower(
      ctx.server,
      attacker.accessToken,
      attackerId,
    );
    expect(powerAfterScoutDispatch.army).toBe(powerBeforeScout.army);

    await waitFor(
      async () => {
        const event = await ctx.prisma.eventOutbox.findFirst({
          where: { kind: 'scout.reported', aggregateId: attackerId },
          orderBy: { createdAt: 'desc' },
        });
        return event &&
          (event.payload as { expeditionId?: string }).expeditionId ===
            barbExpeditionId &&
          event.dispatchedAt
          ? event
          : null;
      },
      { timeoutMs: 15_000 },
    );

    const barbReport = await ctx.prisma.scoutReport.findFirstOrThrow({
      where: { scoutVillageId: attackerId, targetVillageId: barbarian.id },
    });
    expect((barbReport.units as Record<string, number>).MILITIA).toBe(7);
    expect((barbReport.resources as Record<string, number>).wood).toBe(321);
    expect(barbReport.strategy).toBeNull();
    // Barbarians have no newbie shield → field absent (not false).
    expect(
      (barbReport.details as Record<string, unknown>).newbieShield,
    ).toBeUndefined();

    await waitFor(
      async () => {
        const event = await ctx.prisma.eventOutbox.findFirst({
          where: { kind: 'scout.returned', aggregateId: attackerId },
          orderBy: { createdAt: 'desc' },
        });
        return event &&
          (event.payload as { expeditionId?: string }).expeditionId ===
            barbExpeditionId &&
          event.dispatchedAt
          ? event
          : null;
      },
      { timeoutMs: 15_000 },
    );

    const scoutPlayer = await request(ctx.server)
      .post('/combat/scout')
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({
        villageId: attackerId,
        targetX: playerTarget.x,
        targetY: playerTarget.y,
        targetKind: 'PLAYER_VILLAGE',
        targetRefId: playerTarget.id,
        units: { SPY: 1 },
      });
    expect(scoutPlayer.status).toBeLessThan(300);
    const playerExpeditionId = (scoutPlayer.body as { id: string }).id;

    await waitFor(
      async () => {
        const event = await ctx.prisma.eventOutbox.findFirst({
          where: { kind: 'scout.returned', aggregateId: attackerId },
          orderBy: { createdAt: 'desc' },
        });
        return event &&
          (event.payload as { expeditionId?: string }).expeditionId ===
            playerExpeditionId &&
          event.dispatchedAt
          ? event
          : null;
      },
      { timeoutMs: 15_000 },
    );

    const playerReport = await ctx.prisma.scoutReport.findFirstOrThrow({
      where: { scoutVillageId: attackerId, targetVillageId: playerTarget.id },
    });
    expect((playerReport.units as Record<string, number>).SQUIRE).toBe(3);
    expect((playerReport.resources as Record<string, number>).iron).toBe(234);
    expect(playerReport.strategy).toBe('RAIDERS');
    // Castle level is snapshot at scout time → derives the PvP capture window preview.
    const playerDetails = playerReport.details as Record<string, number>;
    expect(playerDetails.castleLevel).toBe(6);
    // Newbie shield is snapshot at scout time (target owner freshly joined).
    const playerShield = (
      playerReport.details as {
        newbieShield?: { active: boolean; endsAt: string | null };
      }
    ).newbieShield;
    expect(playerShield?.active).toBe(true);
    expect(typeof playerShield?.endsAt).toBe('string');
    // Inactivity snapshot (spec 18): the target owner just joined → ACTIVE → no
    // `inactivity` field, and the raw `lastLoginAt` is never leaked into the
    // report details (non-révélation invariant).
    expect(
      (playerReport.details as { inactivity?: unknown }).inactivity,
    ).toBeUndefined();
    expect(
      (playerReport.details as Record<string, unknown>).lastLoginAt,
    ).toBeUndefined();

    // Post-rupture: break the target owner's shield, re-scout → snapshot active=false.
    await ctx.prisma.worldMembership.update({
      where: {
        userId_worldId: { userId: defender.userId, worldId: world.id },
      },
      data: { shieldBrokenAt: new Date() },
    });
    const reScout = await request(ctx.server)
      .post('/combat/scout')
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({
        villageId: attackerId,
        targetX: playerTarget.x,
        targetY: playerTarget.y,
        targetKind: 'PLAYER_VILLAGE',
        targetRefId: playerTarget.id,
        units: { SPY: 1 },
      });
    expect(reScout.status).toBeLessThan(300);
    const reScoutExpeditionId = (reScout.body as { id: string }).id;
    await waitFor(
      async () => {
        const event = await ctx.prisma.eventOutbox.findFirst({
          where: { kind: 'scout.returned', aggregateId: attackerId },
          orderBy: { createdAt: 'desc' },
        });
        return event &&
          (event.payload as { expeditionId?: string }).expeditionId ===
            reScoutExpeditionId &&
          event.dispatchedAt
          ? event
          : null;
      },
      { timeoutMs: 15_000 },
    );
    const postBreakReport = await ctx.prisma.scoutReport.findFirstOrThrow({
      where: { scoutVillageId: attackerId, targetVillageId: playerTarget.id },
      orderBy: { timestamp: 'desc' },
    });
    const postBreakShield = (
      postBreakReport.details as {
        newbieShield?: { active: boolean; endsAt: string | null };
      }
    ).newbieShield;
    expect(postBreakShield).toBeDefined();
    expect(postBreakShield?.active).toBe(false);
    // The re-scout produced a distinct, newer report (not a mutation in place).
    expect(postBreakReport.id).not.toBe(playerReport.id);

    // Immutability: the first report stays frozen (active=true) after the
    // break — proves the snapshot is persisted, not computed on read.
    const initialReportAfterBreak =
      await ctx.prisma.scoutReport.findUniqueOrThrow({
        where: { id: playerReport.id },
      });
    const initialShieldAfterBreak = (
      initialReportAfterBreak.details as {
        newbieShield?: { active: boolean; endsAt: string | null };
      }
    ).newbieShield;
    expect(initialShieldAfterBreak?.active).toBe(true);
    expect(initialShieldAfterBreak?.endsAt).toBe(playerShield?.endsAt);

    // Inactivity snapshot (spec 18): age the target owner's membership past the
    // 7 j threshold, re-scout → the fresh report carries a frozen INACTIVE
    // badge with a derived `sinceDays`, still without leaking the raw timestamp.
    await ctx.prisma.worldMembership.update({
      where: {
        userId_worldId: { userId: defender.userId, worldId: world.id },
      },
      data: {
        lastLoginAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    });
    const inactivityScout = await request(ctx.server)
      .post('/combat/scout')
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({
        villageId: attackerId,
        targetX: playerTarget.x,
        targetY: playerTarget.y,
        targetKind: 'PLAYER_VILLAGE',
        targetRefId: playerTarget.id,
        units: { SPY: 1 },
      });
    expect(inactivityScout.status).toBeLessThan(300);
    const inactivityExpeditionId = (inactivityScout.body as { id: string }).id;
    await waitFor(
      async () => {
        const event = await ctx.prisma.eventOutbox.findFirst({
          where: { kind: 'scout.returned', aggregateId: attackerId },
          orderBy: { createdAt: 'desc' },
        });
        return event &&
          (event.payload as { expeditionId?: string }).expeditionId ===
            inactivityExpeditionId &&
          event.dispatchedAt
          ? event
          : null;
      },
      { timeoutMs: 15_000 },
    );
    const inactivityReport = await ctx.prisma.scoutReport.findFirstOrThrow({
      where: { scoutVillageId: attackerId, targetVillageId: playerTarget.id },
      orderBy: { timestamp: 'desc' },
    });
    const inactivitySnapshot = (
      inactivityReport.details as {
        inactivity?: { state: string; sinceDays: number };
      }
    ).inactivity;
    expect(inactivitySnapshot?.state).toBe('INACTIVE');
    expect(inactivitySnapshot?.sinceDays).toBeGreaterThanOrEqual(7);
    expect(
      (inactivityReport.details as Record<string, unknown>).lastLoginAt,
    ).toBeUndefined();

    const farBarbarian = await ctx.prisma.village.create({
      data: {
        worldId: world.id,
        isBarbarian: true,
        name: 'scout-far-barbarian',
        x: join.village.x + 50,
        y: join.village.y + 50,
        tier: 'T1',
        resourceStock: {
          create: { wood: 0, stone: 0, iron: 0, maxPerType: 100_000 },
        },
      },
    });
    const outsideVision = await request(ctx.server)
      .post('/combat/scout')
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({
        villageId: attackerId,
        targetX: farBarbarian.x,
        targetY: farBarbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: farBarbarian.id,
        units: { SPY: 1 },
      });
    expect(outsideVision.status).toBe(403);

    const finalSpyInventory = await ctx.prisma.unitInventory.findUniqueOrThrow({
      where: {
        villageId_unitType: { villageId: attackerId, unitType: 'SPY' },
      },
    });
    expect(finalSpyInventory.quantity).toBe(2);
  });
});
