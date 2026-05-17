import request from 'supertest';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  seedSmokeWorld,
  truncateAll,
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
    await truncateAll(ctx.prisma);
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
          create: { wood: 321, stone: 222, iron: 123, maxPerType: 100_000 },
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
      },
    });
    await ctx.prisma.unitInventory.create({
      data: { villageId: playerTarget.id, unitType: 'SQUIRE', quantity: 3 },
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
