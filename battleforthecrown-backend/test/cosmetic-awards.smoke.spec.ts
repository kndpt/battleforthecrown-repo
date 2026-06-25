import request from 'supertest';
import { WorldLifecycleWorker } from '../src/workers/world-lifecycle.worker';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  type SmokeContext,
} from './helpers';
import { SMOKE_WORLD_CONFIG } from './fixtures/smoke-world-config';

describe('cosmetic awards smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('fast-forward to ENDED → 3 permanent titles to the champion + GET /users/me/cosmetic-awards', async () => {
    // 1. Seed an OPEN world with two members. SMOKE_WORLD_CONFIG carries an
    //    identity.displayName ("Smoke World") the award snapshots verbatim.
    const world = await ctx.prisma.world.create({
      data: {
        id: `cosmetic-${Date.now()}`,
        name: 'Cosmetic Awards Smoke',
        status: 'OPEN',
        config: { ...SMOKE_WORLD_CONFIG },
      },
    });
    const worldId = world.id;

    const alice = await registerUser(ctx.server, 'cos-alice-' + Date.now());
    const bob = await registerUser(ctx.server, 'cos-bob-' + Date.now());
    const joinAlice = await joinWorld(
      ctx.server,
      alice.accessToken,
      worldId,
      'village-alice',
    );
    await joinWorld(ctx.server, bob.accessToken, worldId, 'village-bob');

    // 2. Make Alice the POWER champion: a large army dominates kingdom power.
    await ctx.prisma.unitInventory.create({
      data: {
        villageId: joinAlice.village.id,
        unitType: 'MILITIA',
        quantity: 500,
      },
    });

    // 3. Give Alice glory > 0 on BOTH PvP signals so she ranks 1 with a non-zero
    //    score (a 0-score glory champion is intentionally NOT awarded). Glory
    //    rows require a CombatReport FK, so seed a minimal one.
    const report = await ctx.prisma.combatReport.create({
      data: {
        worldId,
        attackerVillageId: joinAlice.village.id,
        attackerUserId: alice.userId,
        defenderUserId: bob.userId,
        targetKind: 'PLAYER_VILLAGE',
        targetX: 0,
        targetY: 0,
        loot: {},
        lossesAttacker: {},
        details: {},
      },
    });
    for (const [signal, points] of [
      ['ASSAULT_GLORY', 120],
      ['RAMPART_GLORY', 80],
    ] as const) {
      await ctx.prisma.gloryLedger.create({
        data: {
          worldId,
          signal,
          scorerUserId: alice.userId,
          opponentUserId: bob.userId,
          pairKey: [alice.userId, bob.userId].sort().join(':'),
          combatReportId: report.id,
          rawPoints: points,
          effectiveRawPoints: points,
          opponentMultiplier: 1,
          points,
        },
      });
    }

    // 4. Force LOCKED with endsAt in the past, run the lifecycle worker → ENDED.
    await ctx.prisma.world.update({
      where: { id: worldId },
      data: {
        status: 'LOCKED',
        startedAt: new Date(Date.now() - 61 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() - 1000),
      },
    });
    const worker = ctx.app.get(WorldLifecycleWorker);
    const result = await worker.handleLifecycleTick(new Date());
    expect(result.lockedToEnded).toBeGreaterThanOrEqual(1);

    const worldAfter = await ctx.prisma.world.findUniqueOrThrow({
      where: { id: worldId },
    });
    expect(worldAfter.status).toBe('ENDED');

    // 5a. Exactly 3 awards in DB (POWER + ASSAULT + RAMPART), all to Alice, all
    //     snapshotting the world display name.
    const awards = await ctx.prisma.userWorldCosmeticAward.findMany({
      where: { worldId },
    });
    expect(awards).toHaveLength(3);
    expect(awards.every((a) => a.userId === alice.userId)).toBe(true);
    expect(awards.every((a) => a.worldDisplayName === 'Smoke World')).toBe(
      true,
    );
    expect(awards.map((a) => a.kind).sort()).toEqual([
      'ASSAULT_CHAMPION_TITLE',
      'POWER_CHAMPION_TITLE',
      'RAMPART_CHAMPION_TITLE',
    ]);

    // 5b. Endpoint returns Alice's 3 titles, sorted awardedAt DESC.
    const aliceRes = await request(ctx.server)
      .get('/users/me/cosmetic-awards')
      .set('Authorization', `Bearer ${alice.accessToken}`);
    expect(aliceRes.status).toBe(200);
    const aliceBody = aliceRes.body as {
      kind: string;
      worldDisplayName: string;
      awardedAt: string;
    }[];
    expect(aliceBody).toHaveLength(3);
    expect(aliceBody.map((a) => a.kind).sort()).toEqual([
      'ASSAULT_CHAMPION_TITLE',
      'POWER_CHAMPION_TITLE',
      'RAMPART_CHAMPION_TITLE',
    ]);
    expect(aliceBody.every((a) => a.worldDisplayName === 'Smoke World')).toBe(
      true,
    );

    // 5c. Bob (no rank-1) sees an empty list.
    const bobRes = await request(ctx.server)
      .get('/users/me/cosmetic-awards')
      .set('Authorization', `Bearer ${bob.accessToken}`);
    expect(bobRes.status).toBe(200);
    expect(bobRes.body).toEqual([]);

    // 5d. Idempotence: re-running the tick must not duplicate awards (unique
    //     constraint + skipDuplicates). The world is already ENDED so the
    //     transition is a no-op, but assert the count is stable regardless.
    await worker.handleLifecycleTick(new Date());
    const awardsAfterReplay = await ctx.prisma.userWorldCosmeticAward.count({
      where: { worldId },
    });
    expect(awardsAfterReplay).toBe(3);
  }, 90_000);
});
