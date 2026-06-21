import request from 'supertest';
import { WorldLifecycleWorker } from '../src/workers/world-lifecycle.worker';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  waitFor,
  type SmokeContext,
} from './helpers';
import { SMOKE_WORLD_CONFIG } from './fixtures/smoke-world-config';

describe('world-ended lifecycle smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('fast-forward: LOCKED world with in-flight expedition → ENDED, snapshot, 403 on attack, recall allowed, GET 200', async () => {
    // 1. Seed world OPEN, no fog-of-war so the attacker can always see the target
    const world = await ctx.prisma.world.create({
      data: {
        id: `ended-lifecycle-${Date.now()}`,
        name: 'Ended Lifecycle Smoke',
        status: 'OPEN',
        config: {
          ...SMOKE_WORLD_CONFIG,
          fogOfWar: { enabled: false },
        },
      },
    });
    const worldId = world.id;

    // 2. Register attacker + defender and join the world (2 memberships → 6 snapshot rows)
    const attacker = await registerUser(ctx.server, 'atk-' + Date.now());
    const defender = await registerUser(ctx.server, 'def-' + Date.now());

    const joinAtk = await joinWorld(
      ctx.server,
      attacker.accessToken,
      worldId,
      'village-attacker',
    );
    const joinDef = await joinWorld(
      ctx.server,
      defender.accessToken,
      worldId,
      'village-defender',
    );
    const attackerVillageId = joinAtk.village.id;

    // 3. Give attacker units + vision radius
    await ctx.prisma.unitInventory.create({
      data: { villageId: attackerVillageId, unitType: 'MILITIA', quantity: 50 },
    });
    await ctx.prisma.population.update({
      where: { villageId: attackerVillageId },
      data: { used: 50, max: 200 },
    });
    // Watchtower lvl 1 → radius 5 (needed even if fog-of-war is off, for safety)
    await ctx.prisma.building.updateMany({
      where: { villageId: attackerVillageId, type: 'WATCHTOWER' },
      data: { level: 1 },
    });

    // 4. Create a barbarian target close to the attacker (so it stays EN_ROUTE long enough)
    const barbarian = await ctx.prisma.village.create({
      data: {
        worldId,
        name: 'Barb-Ended-Target',
        x: joinAtk.village.x + 10,
        y: joinAtk.village.y + 10,
        isBarbarian: true,
        tier: 'T1',
        resourceStock: {
          create: { wood: 200, stone: 200, iron: 100, maxPerType: 100_000 },
        },
      },
    });

    // 5. Attacker launches attack → expedition EN_ROUTE (in-flight)
    const attackRes = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({
        villageId: attackerVillageId,
        targetX: barbarian.x,
        targetY: barbarian.y,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: barbarian.id,
        units: { MILITIA: 50 },
      });
    expect(attackRes.status).toBeLessThan(300);
    const expeditionId = (attackRes.body as { id: string }).id;

    // Confirm the expedition is indeed EN_ROUTE
    const expBefore = await ctx.prisma.expedition.findUniqueOrThrow({
      where: { id: expeditionId },
    });
    expect(expBefore.status).toBe('EN_ROUTE');

    // 6. Force the world into LOCKED with endsAt in the past
    await ctx.prisma.world.update({
      where: { id: worldId },
      data: {
        status: 'LOCKED',
        startedAt: new Date(Date.now() - 61 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() - 1000),
      },
    });

    // Guard the "2 memberships → 6 snapshot rows" assumption below: if an extra
    // member ever leaked into the world the snapshot count check would fail with
    // a misleading message instead of pointing at the real cause.
    const membershipCount = await ctx.prisma.worldMembership.count({
      where: { worldId },
    });
    expect(membershipCount).toBe(2);

    // 7. Trigger the lifecycle worker → should transition LOCKED → ENDED + snapshot
    const worker = ctx.app.get(WorldLifecycleWorker);
    const result = await worker.handleLifecycleTick(new Date());
    expect(result.lockedToEnded).toBe(1);

    // 5a. World status is ENDED
    const worldAfter = await ctx.prisma.world.findUniqueOrThrow({
      where: { id: worldId },
    });
    expect(worldAfter.status).toBe('ENDED');

    // 5b. Snapshot non empty: 3 signals × 2 members = 6 rows; at least one POWER row
    const snapshots = await ctx.prisma.worldFinalRankingSnapshot.findMany({
      where: { worldId },
    });
    expect(snapshots.length).toBeGreaterThanOrEqual(3);
    const hasPower = snapshots.some((s) => s.signal === 'POWER');
    expect(hasPower).toBe(true);
    // With 2 members: exactly 6 rows (POWER×2 + ASSAULT_GLORY×2 + RAMPART_GLORY×2)
    expect(snapshots.length).toBe(6);

    // 5c. New attack from attacker → 403 with WORLD_READ_ONLY
    const attackBlocked = await request(ctx.server)
      .post('/combat/attack')
      .set('Authorization', `Bearer ${attacker.accessToken}`)
      .send({
        villageId: attackerVillageId,
        targetX: joinDef.village.x,
        targetY: joinDef.village.y,
        targetKind: 'PLAYER_VILLAGE',
        targetRefId: joinDef.village.id,
        units: { MILITIA: 1 },
      });
    expect(attackBlocked.status).toBe(403);
    expect(JSON.stringify(attackBlocked.body)).toContain('WORLD_READ_ONLY');

    // 5d. Recall the in-flight expedition → 2xx even on ENDED world
    const recallRes = await request(ctx.server)
      .post(`/combat/recall/${expeditionId}`)
      .set('Authorization', `Bearer ${attacker.accessToken}`);
    expect(recallRes.status).toBeLessThan(300);

    // Verify the expedition is now RETURNING
    const expAfterRecall = await ctx.prisma.expedition.findUnique({
      where: { id: expeditionId },
    });
    expect(expAfterRecall?.recalled).toBe(true);
    expect(expAfterRecall?.status).toBe('RETURNING');

    // Wait for troops to return home (travelSpeed is fast in smoke config)
    await waitFor(
      async () => {
        const inv = await ctx.prisma.unitInventory.findUnique({
          where: {
            villageId_unitType: {
              villageId: attackerVillageId,
              unitType: 'MILITIA',
            },
          },
        });
        return inv?.quantity === 50 ? true : null;
      },
      { timeoutMs: 30_000 },
    );

    // 5e. Reading the world endpoint returns 200
    const worldReadRes = await request(ctx.server).get(
      `/world/${worldId}/details`,
    );
    expect(worldReadRes.status).toBe(200);
  }, 90_000);
});
