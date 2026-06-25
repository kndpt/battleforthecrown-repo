import request from 'supertest';
import { RankingSignal } from '@prisma/client';
import { RankingsCycleService } from '../src/modules/rankings/rankings-cycle.service';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  type SmokeContext,
} from './helpers';
import { SMOKE_WORLD_CONFIG } from './fixtures/smoke-world-config';

/**
 * Run 068 — weekly Glory cycle close + temporary titles.
 *
 * The world is created on a Monday 00:00 UTC so cycle boundaries are exact:
 * cycle 1 = [Jun 01, Jun 08), cycle 2 = [Jun 08, Jun 15). Closing with a fixed
 * `now = Jun 15 00:05 UTC` makes exactly cycles 1 & 2 due → 4 snapshots
 * (2 weeks × 2 Glory signals).
 */
describe('rankings weekly cycle close smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  async function seedGlory(
    worldId: string,
    reportId: string,
    signal: RankingSignal,
    scorerUserId: string,
    opponentUserId: string,
    points: number,
    occurredAt: Date,
  ): Promise<void> {
    await ctx.prisma.combatReport.create({
      data: {
        id: reportId,
        worldId,
        attackerVillageId: `att-${reportId}`,
        attackerUserId: scorerUserId,
        targetKind: 'PLAYER_VILLAGE',
        targetX: 0,
        targetY: 0,
        loot: {},
        lossesAttacker: {},
        details: {},
      },
    });
    await ctx.prisma.gloryLedger.create({
      data: {
        worldId,
        signal,
        scorerUserId,
        opponentUserId,
        pairKey: [scorerUserId, opponentUserId].sort().join(':'),
        combatReportId: reportId,
        rawPoints: points,
        effectiveRawPoints: points,
        opponentMultiplier: 1,
        points,
        occurredAt,
      },
    });
  }

  it('closes due cycles, awards rank-1 titles, exposes cycles + titles endpoints', async () => {
    const stamp = Date.now();
    const worldId = `cycle-${stamp}`;
    await ctx.prisma.world.create({
      data: {
        id: worldId,
        name: 'Cycle Smoke',
        status: 'OPEN',
        config: { ...SMOKE_WORLD_CONFIG },
        createdAt: new Date('2026-06-01T00:00:00.000Z'), // Monday 00:00 UTC
      },
    });

    const alice = await registerUser(ctx.server, `cyc-alice-${stamp}`);
    const bob = await registerUser(ctx.server, `cyc-bob-${stamp}`);
    await joinWorld(ctx.server, alice.accessToken, worldId, 'village-alice');
    await joinWorld(ctx.server, bob.accessToken, worldId, 'village-bob');

    const inCycle1 = new Date('2026-06-03T10:00:00.000Z');
    const inCycle2 = new Date('2026-06-10T10:00:00.000Z');
    // Cycle 1: alice tops ASSAULT, bob tops RAMPART.
    await seedGlory(
      worldId,
      `r1a-${stamp}`,
      RankingSignal.ASSAULT_GLORY,
      alice.userId,
      bob.userId,
      100,
      inCycle1,
    );
    await seedGlory(
      worldId,
      `r1b-${stamp}`,
      RankingSignal.ASSAULT_GLORY,
      bob.userId,
      alice.userId,
      40,
      inCycle1,
    );
    await seedGlory(
      worldId,
      `r1c-${stamp}`,
      RankingSignal.RAMPART_GLORY,
      bob.userId,
      alice.userId,
      80,
      inCycle1,
    );
    // Cycle 2: same winners, fresh scores.
    await seedGlory(
      worldId,
      `r2a-${stamp}`,
      RankingSignal.ASSAULT_GLORY,
      alice.userId,
      bob.userId,
      200,
      inCycle2,
    );
    await seedGlory(
      worldId,
      `r2b-${stamp}`,
      RankingSignal.RAMPART_GLORY,
      bob.userId,
      alice.userId,
      150,
      inCycle2,
    );

    const service = ctx.app.get(RankingsCycleService);
    const closeAt = new Date('2026-06-15T00:05:00.000Z');
    const closed = await service.closeDueCycles(closeAt);
    expect(closed).toBe(4); // 2 cycles × 2 signals

    // Idempotence: a second tick on the same instant is a no-op.
    const closedAgain = await service.closeDueCycles(closeAt);
    expect(closedAgain).toBe(0);

    const snapshots = await ctx.prisma.gloryCycleSnapshot.count({
      where: { worldId },
    });
    expect(snapshots).toBe(4);

    // alice owns both ASSAULT titles, bob both RAMPART titles.
    const aliceTitles = await ctx.prisma.rankingCycleTitleAward.findMany({
      where: { worldId, userId: alice.userId },
      orderBy: { cycleIndex: 'asc' },
    });
    expect(aliceTitles.map((t) => [t.signal, t.cycleIndex])).toEqual([
      ['ASSAULT_GLORY', 1],
      ['ASSAULT_GLORY', 2],
    ]);
    const bobTitles = await ctx.prisma.rankingCycleTitleAward.findMany({
      where: { worldId, userId: bob.userId },
    });
    expect(bobTitles.every((t) => t.signal === 'RAMPART_GLORY')).toBe(true);
    expect(bobTitles.length).toBe(2);

    // Public cycles endpoint: both Glory signals, last closed = cycle 2.
    const cyclesRes = await request(ctx.server).get(
      `/worlds/${worldId}/rankings/cycles/current`,
    );
    expect(cyclesRes.status).toBe(200);
    const cyclesBody = cyclesRes.body as {
      cycles: {
        signal: string;
        lastClosedSnapshot: { cycleIndex: number } | null;
      }[];
    };
    expect(cyclesBody.cycles.map((c) => c.signal).sort()).toEqual([
      'ASSAULT_GLORY',
      'RAMPART_GLORY',
    ]);
    expect(
      cyclesBody.cycles.every((c) => c.lastClosedSnapshot?.cycleIndex === 2),
    ).toBe(true);

    // Authenticated titles endpoint for alice.
    const titlesRes = await request(ctx.server)
      .get('/users/me/ranking-titles')
      .set('Authorization', `Bearer ${alice.accessToken}`);
    expect(titlesRes.status).toBe(200);
    const titlesBody = titlesRes.body as {
      signal: string;
      cycleIndex: number;
      worldDisplayName: string;
      label: string;
    }[];
    const worldTitles = titlesBody.filter(
      (t) => t.signal === 'ASSAULT_GLORY' && t.label.includes('Champion'),
    );
    expect(worldTitles.length).toBeGreaterThanOrEqual(2);
    expect(typeof worldTitles[0]?.worldDisplayName).toBe('string');
    expect(worldTitles[0]?.worldDisplayName.length).toBeGreaterThan(0);
  }, 60_000);

  it('closes cycles due before a world ENDED, clamped to endsAt', async () => {
    const stamp = Date.now();
    const worldId = `cycle-ended-${stamp}`;
    // World ended mid-cycle-2 (Wed Jun 10). Cycle 1 [Jun01,Jun08) fully elapsed
    // before the end → must be snapshotted. Cycle 2 [Jun08,Jun15) only completes
    // after endsAt → must NOT be closed (no cycles past the real world end).
    await ctx.prisma.world.create({
      data: {
        id: worldId,
        name: 'Cycle Ended Smoke',
        status: 'OPEN',
        config: { ...SMOKE_WORLD_CONFIG },
        createdAt: new Date('2026-06-01T00:00:00.000Z'), // Monday 00:00 UTC
      },
    });

    const carol = await registerUser(ctx.server, `cyc-carol-${stamp}`);
    const dave = await registerUser(ctx.server, `cyc-dave-${stamp}`);
    await joinWorld(ctx.server, carol.accessToken, worldId, 'village-carol');
    await joinWorld(ctx.server, dave.accessToken, worldId, 'village-dave');

    // Flip to ENDED mid-cycle-2 once players are in (join requires OPEN).
    await ctx.prisma.world.update({
      where: { id: worldId },
      data: { status: 'ENDED', endsAt: new Date('2026-06-10T00:00:00.000Z') },
    });

    await seedGlory(
      worldId,
      `re1-${stamp}`,
      RankingSignal.ASSAULT_GLORY,
      carol.userId,
      dave.userId,
      100,
      new Date('2026-06-03T10:00:00.000Z'), // in cycle 1
    );
    // Seeded in cycle 2 — proves this window is ignored once clamped to endsAt.
    await seedGlory(
      worldId,
      `re2-${stamp}`,
      RankingSignal.ASSAULT_GLORY,
      dave.userId,
      carol.userId,
      999,
      new Date('2026-06-09T10:00:00.000Z'),
    );

    const service = ctx.app.get(RankingsCycleService);
    // `now` is well after the world ended: without the clamp this would close
    // cycle 2 too; with it, only the cycle-1 pair (2 signals) closes.
    const closed = await service.closeDueCycles(
      new Date('2026-06-20T00:05:00.000Z'),
    );
    expect(closed).toBe(2); // cycle 1 × 2 signals

    const snapshots = await ctx.prisma.gloryCycleSnapshot.findMany({
      where: { worldId },
      select: { cycleIndex: true },
    });
    expect(snapshots.every((s) => s.cycleIndex === 1)).toBe(true);
    expect(snapshots.length).toBe(2);
  }, 60_000);
});
