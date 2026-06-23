import request from 'supertest';
import { WorldLifecycleWorker } from '../src/workers/world-lifecycle.worker';
import {
  bootSmokeApp,
  joinWorld,
  registerUser,
  type SmokeContext,
} from './helpers';
import { SMOKE_WORLD_CONFIG } from './fixtures/smoke-world-config';

describe('world final rankings endpoint smoke', () => {
  let ctx: SmokeContext;

  beforeAll(async () => {
    ctx = await bootSmokeApp();
    await ctx.app.listen(0);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('GET /worlds/:id/rankings/final: 404 before ENDED, 200 after snapshot, 409 if snapshot missing', async () => {
    // 1. Seed an OPEN world with two members.
    const world = await ctx.prisma.world.create({
      data: {
        id: `final-rankings-${Date.now()}`,
        name: 'Final Rankings Smoke',
        status: 'OPEN',
        config: { ...SMOKE_WORLD_CONFIG },
      },
    });
    const worldId = world.id;

    const alice = await registerUser(ctx.server, 'fr-alice-' + Date.now());
    const bob = await registerUser(ctx.server, 'fr-bob-' + Date.now());
    await joinWorld(ctx.server, alice.accessToken, worldId, 'village-alice');
    await joinWorld(ctx.server, bob.accessToken, worldId, 'village-bob');

    // 2. Not ENDED yet → 404 (snapshot legitimately absent).
    const before = await request(ctx.server).get(
      `/worlds/${worldId}/rankings/final`,
    );
    expect(before.status).toBe(404);

    // 3. Force LOCKED with endsAt in the past, run the lifecycle worker → ENDED + snapshot.
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

    // 4. ENDED with snapshot → 200, three signals, sorted entries with displayName.
    const ok = await request(ctx.server).get(
      `/worlds/${worldId}/rankings/final`,
    );
    expect(ok.status).toBe(200);
    const body = ok.body as {
      worldId: string;
      snapshotAt: string;
      leaderboards: {
        signal: string;
        period: string;
        entries: { rank: number; userId: string; playerName: string }[];
      }[];
    };
    expect(body.worldId).toBe(worldId);
    expect(typeof body.snapshotAt).toBe('string');
    const signals = body.leaderboards.map((b) => b.signal).sort();
    expect(signals).toEqual(['ASSAULT_GLORY', 'POWER', 'RAMPART_GLORY']);
    const power = body.leaderboards.find((b) => b.signal === 'POWER');
    expect(power?.period).toBe('FINAL');
    expect(power?.entries.length).toBe(2);
    expect(power?.entries[0]?.rank).toBe(1);
    expect(typeof power?.entries[0]?.playerName).toBe('string');

    // 5. ENDED world is still listed publicly with a derived archiveAt.
    const publicRes = await request(ctx.server).get('/worlds/public');
    expect(publicRes.status).toBe(200);
    const listed = (
      publicRes.body as {
        id: string;
        status: string;
        lifecycle: { archiveAt: string | null };
      }[]
    ).find((w) => w.id === worldId);
    expect(listed?.status).toBe('ENDED');
    expect(listed?.lifecycle.archiveAt).not.toBeNull();

    // 6. Snapshot wiped while still ENDED → 409 (invariant corruption).
    await ctx.prisma.worldFinalRankingSnapshot.deleteMany({
      where: { worldId },
    });
    const corrupt = await request(ctx.server).get(
      `/worlds/${worldId}/rankings/final`,
    );
    expect(corrupt.status).toBe(409);
  }, 60_000);
});
