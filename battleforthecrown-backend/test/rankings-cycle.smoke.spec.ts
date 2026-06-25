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
});
